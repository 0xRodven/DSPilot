#!/usr/bin/env python3
"""
Scrape Amazon Logistics delivery concessions page for DNR data.

Full pipeline:
1. Navigate to dsp_delivery_concessions
2. Paginate through ALL pages of the table
3. For each tracking ID, click to open the detail popup
4. From the popup, click "Afficher plus de détails sur Cortex" for delivery type
5. Save structured JSON for Convex ingestion

Handles 50-100+ entries per week across multiple pages.
"""

import argparse
import asyncio
import json
import os
import re
import subprocess
from datetime import datetime
from pathlib import Path

import nodriver as uc
from bs4 import BeautifulSoup

BASE_URL = os.getenv("AMAZON_LOGISTICS_BASE_URL", "https://logistics.amazon.fr").rstrip("/")
DEFAULT_OUTPUT_DIR = Path(__file__).parent / "data" / "concessions"
CONCESSIONS_URL_TEMPLATE = (
    "{base}/performance?pageId=dsp_delivery_concessions"
    "&station=ALL&companyId={company_id}"
    "&tabId=delivery-concessions-weekly-tab"
    "&timeFrame=Weekly&to={week_iso}"
)


def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


# ---------------------------------------------------------------------------
# Browser helpers
# ---------------------------------------------------------------------------

async def navigate_with_fallback(page, url, wait_seconds=5, timeout_seconds=30):
    log(f"Opening {url}")
    try:
        await asyncio.wait_for(page.get(url), timeout=timeout_seconds)
    except asyncio.TimeoutError:
        log("  Navigation timed out, using CDP fallback")
        try:
            await asyncio.wait_for(page.send(uc.cdp.page.navigate(url)), timeout=10)
        except asyncio.TimeoutError:
            await asyncio.wait_for(
                page.evaluate(f"window.location.href = {json.dumps(url)}"), timeout=5
            )
    await asyncio.sleep(wait_seconds)


async def get_page_html(page, timeout_seconds=20):
    try:
        return await asyncio.wait_for(page.get_content(), timeout=timeout_seconds)
    except asyncio.TimeoutError:
        html = await asyncio.wait_for(
            page.evaluate("document.documentElement.outerHTML", return_by_value=True),
            timeout=10,
        )
        return html if isinstance(html, str) else str(html)


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def parse_tracking_table(html):
    """Parse the main concessions table to get tracking IDs from current page."""
    soup = BeautifulSoup(html, "html.parser")
    rows = []

    table = soup.find("table")
    if not table:
        return rows

    for tr in table.find_all("tr")[1:]:
        cells = tr.find_all(["td", "th"])
        if len(cells) < 2:
            continue

        tracking_id = None
        for cell in cells:
            link = cell.find("a")
            text = (link or cell).get_text(strip=True)
            if re.match(r"^[A-Z]{2}\d{7,}", text):
                tracking_id = text
                break

        if tracking_id:
            rows.append({"trackingId": tracking_id})

    return rows


def has_next_page(html):
    """Check if there's a 'Next' pagination button that is not disabled."""
    soup = BeautifulSoup(html, "html.parser")
    # Look for pagination buttons: "Suivant", "Next", ">" or aria-label="next"
    for btn in soup.find_all("button"):
        text = btn.get_text(strip=True).lower()
        aria = (btn.get("aria-label") or "").lower()
        if any(kw in text or kw in aria for kw in ["suivant", "next", "›", ">"]):
            disabled = btn.get("disabled") is not None or "disabled" in btn.get("class", [])
            if not disabled:
                return True
    # Also check for anchor-based pagination
    for a in soup.find_all("a"):
        text = a.get_text(strip=True).lower()
        if "suivant" in text or "next" in text:
            return True
    return False


def parse_detail_popup(html):
    """Parse the detail popup for a single tracking ID.

    Extracts key-value pairs from the delivery contrast card:
        Zone de service/DSP: DIF1 / PSUA
        Livreur: Mamadou CISSE
        ID du transporteur: A23G2BWS2BTO69
        Date de livraison: 2026-03-17 15:40:15
        Date de concession: 2026-04-01 10:41:30
        Lieu de dépôt: DELIVERED_TO_MAIL_SLOT
        Adresse: 3 rue des abbesses, paris, 75018
        Notes du client: bal 8
        Distance: 11.02 mètres
        GPS planifié / réel
    """
    soup = BeautifulSoup(html, "html.parser")
    detail = {}

    # Strategy 1: dt/dd pairs (most common on Amazon)
    for dt in soup.find_all("dt"):
        dd = dt.find_next_sibling("dd")
        if dd:
            key = dt.get_text(strip=True).lower()
            val = dd.get_text(" ", strip=True)
            detail[key] = val

    # Strategy 2: adjacent div/span label+value pairs
    all_text_nodes = soup.find_all(string=True)
    for i, node in enumerate(all_text_nodes):
        text = node.strip()
        if not text:
            continue
        # Detect known label patterns
        for label in [
            "zone de service", "livreur", "id du transporteur",
            "date de livraison", "date de concession", "lieu de dépôt",
            "adresse", "notes du client", "distance entre",
            "emplacement planifié", "emplacement réel",
            "group stop",
        ]:
            if label in text.lower() and label not in detail:
                # Value is typically the next meaningful text node
                for j in range(i + 1, min(i + 5, len(all_text_nodes))):
                    val = all_text_nodes[j].strip()
                    if val and val != text:
                        detail[label] = val
                        break

    return detail


def parse_cortex_detail(html):
    """Parse Cortex page for delivery type classification.

    Cortex shows: delivery method (boîte aux lettres, main propre, voisin, etc.)
    and additional shipment metadata.
    """
    soup = BeautifulSoup(html, "html.parser")
    cortex = {}

    # Cortex uses various layouts — try multiple strategies
    # Strategy 1: dt/dd
    for dt in soup.find_all("dt"):
        dd = dt.find_next_sibling("dd")
        if dd:
            key = dt.get_text(strip=True).lower()
            val = dd.get_text(" ", strip=True)
            cortex[key] = val

    # Strategy 2: key-value text patterns
    for el in soup.find_all(["div", "span", "td", "p"]):
        text = el.get_text(strip=True)
        # Look for delivery method indicators
        for kw in ["type de livraison", "delivery type", "méthode", "method",
                    "boîte aux lettres", "main propre", "voisin", "lieu sûr",
                    "réception", "reception"]:
            if kw in text.lower():
                cortex[kw] = text

    return cortex


def extract_investigation(detail, tracking_id, year, week, cortex_data=None):
    """Extract structured investigation data from parsed detail + optional Cortex."""

    def get(keys, default=""):
        for k in keys:
            for dk, dv in detail.items():
                if k in dk.lower():
                    return dv
        return default

    driver_name = get(["livreur", "driver"])
    transporter_id = get(["transporteur", "transporter id"])
    delivery_dt = get(["date de livraison", "delivery date"])
    concession_dt = get(["date de concession", "concession date"])
    scan_type = get(["lieu de dépôt", "lieu de depot", "delivery scan", "scan"])

    # Address parsing
    street = get(["adresse", "address"])
    building = get(["bâtiment", "building", "bat"]) or None
    floor_val = get(["étage", "floor"]) or None
    postal_code = ""
    city = ""

    # Extract postal code + city from address text
    # Address can be multi-line: "3 rue des abbesses\nparis\n75018"
    addr_parts = street.split("\n") if "\n" in street else [street]
    for part in addr_parts:
        pc_match = re.search(r"\b(\d{5})\b", part)
        if pc_match:
            postal_code = pc_match.group(1)
            city = re.sub(r"\b\d{5}\b", "", part).strip()

    # If city not found, check next parts
    if not city:
        for part in addr_parts[1:]:
            clean = part.strip()
            if clean and not re.match(r"^\d{5}$", clean) and clean.lower() != "group stop":
                city = clean
                break

    # If street is multi-line, take first line as street
    if "\n" in street:
        street = addr_parts[0].strip()

    # GPS
    def parse_gps(text):
        coords = re.findall(r"(-?\d+\.\d+)°?", text)
        if len(coords) >= 2:
            return {"lat": float(coords[0]), "lng": float(coords[1])}
        return None

    gps_planned = parse_gps(get(["emplacement planifié", "planned location"]))
    gps_actual = parse_gps(get(["emplacement réel", "actual location"]))

    # Distance
    distance = None
    dist_text = get(["distance", "mètres", "meters"])
    dist_match = re.search(r"([\d.]+)\s*m", dist_text)
    if dist_match:
        distance = float(dist_match.group(1))

    customer_notes = get(["notes du client", "customer notes"]) or None

    # Cortex delivery type
    delivery_type = None
    if cortex_data:
        delivery_type = (
            cortex_data.get("type de livraison")
            or cortex_data.get("delivery type")
            or cortex_data.get("méthode")
            or None
        )

    result = {
        "trackingId": tracking_id,
        "transporterId": transporter_id,
        "driverName": driver_name,
        "year": year,
        "week": week,
        "deliveryDatetime": delivery_dt,
        "concessionDatetime": concession_dt,
        "scanType": scan_type or "UNKNOWN",
        "address": {
            "street": street,
            "building": building,
            "floor": floor_val,
            "postalCode": postal_code,
            "city": city,
        },
        "gpsPlanned": gps_planned,
        "gpsActual": gps_actual,
        "gpsDistanceMeters": distance,
        "customerNotes": customer_notes,
        "status": "ongoing",
    }

    if delivery_type:
        result["deliveryType"] = delivery_type

    return result


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def save_json(target, data):
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return target


def run_ingest(output_dir, station_code, organization_id):
    cmd = [
        "npx", "tsx", "scripts/ingest-concessions.ts",
        "--artifacts-dir", str(output_dir),
        "--station-code", station_code,
        "--organization-id", organization_id,
    ]
    log(f"  Running ingest: {' '.join(cmd)}")
    subprocess.run(cmd, check=True, cwd=Path(__file__).resolve().parents[1])


# ---------------------------------------------------------------------------
# Main scraping flow
# ---------------------------------------------------------------------------

async def click_next_page(page):
    """Click the pagination 'Next' button. Returns True if clicked."""
    # Try multiple selectors for the Next button
    for selector in [
        'button[aria-label="next"]',
        'button[aria-label="Next"]',
        'button[aria-label="Suivant"]',
    ]:
        try:
            btn = await page.select(selector, timeout=3)
            if btn:
                await btn.click()
                await asyncio.sleep(4)
                return True
        except Exception:
            continue

    # Fallback: find by text content
    try:
        btn = await page.find("Suivant", timeout=3)
        if btn:
            await btn.click()
            await asyncio.sleep(4)
            return True
    except Exception:
        pass

    # Try the "›" or ">" button
    try:
        btn = await page.find("›", timeout=2)
        if btn:
            await btn.click()
            await asyncio.sleep(4)
            return True
    except Exception:
        pass

    return False


async def collect_all_tracking_ids(page):
    """Paginate through all table pages and collect every tracking ID."""
    all_ids = []
    page_num = 1

    while True:
        html = await get_page_html(page)
        ids = parse_tracking_table(html)
        log(f"    Page {page_num}: {len(ids)} tracking(s)")
        all_ids.extend(ids)

        if not has_next_page(html):
            break

        clicked = await click_next_page(page)
        if not clicked:
            break

        page_num += 1
        # Safety: max 20 pages
        if page_num > 20:
            log("    Max pages reached (20), stopping pagination")
            break

    return all_ids


async def fetch_detail_and_cortex(page, tracking_id, skip_cortex=False):
    """Click tracking ID → extract detail → optionally click Cortex → return data."""
    detail = {}
    cortex_data = None

    try:
        link = await page.find(tracking_id, timeout=5)
        if not link:
            log(f"      Link not found for {tracking_id}")
            return None, None

        await link.click()
        await asyncio.sleep(3)

        detail_html = await get_page_html(page)
        detail = parse_detail_popup(detail_html)

        # Try Cortex detail
        if not skip_cortex:
            try:
                cortex_link = await page.find("Cortex", timeout=3)
                if cortex_link:
                    await cortex_link.click()
                    await asyncio.sleep(4)

                    cortex_html = await get_page_html(page)
                    cortex_data = parse_cortex_detail(cortex_html)

                    # Go back from Cortex to detail
                    await page.evaluate("window.history.back()")
                    await asyncio.sleep(2)
            except Exception as e:
                log(f"      Cortex fetch failed for {tracking_id}: {e}")

        # Go back to the table
        await page.evaluate("window.history.back()")
        await asyncio.sleep(3)

    except Exception as e:
        log(f"      Error for {tracking_id}: {e}")
        # Try to recover navigation
        try:
            await page.evaluate("window.history.back()")
            await asyncio.sleep(2)
        except Exception:
            pass

    return detail, cortex_data


async def capture_concessions(args):
    from amazon_deep_scraper import close_browser, load_cookies_and_login, looks_like_login_page, setup_browser

    browser = await setup_browser()
    page = await load_cookies_and_login(browser)
    if not page:
        await close_browser(browser)
        raise SystemExit(1)

    company_id = args.company_id or os.getenv("AMAZON_COMPANY_ID", "")
    captures = []

    for week_offset in range(args.weeks):
        from isoweek import Week

        target = Week.thisweek() - week_offset
        if args.target_week and args.target_year and week_offset == 0:
            target = Week(args.target_year, args.target_week)

        week_iso = f"{target.year}-W{target.week:02d}"
        week_slug = f"week-{target.week:02d}-{target.year}"

        url = CONCESSIONS_URL_TEMPLATE.format(
            base=BASE_URL, company_id=company_id, week_iso=week_iso
        )
        await navigate_with_fallback(page, url, wait_seconds=6)

        html = await get_page_html(page)
        if looks_like_login_page(html):
            raise RuntimeError("concessions_page_redirected_to_login")

        # Step 1: Collect ALL tracking IDs across all pages
        log(f"  Week {week_iso}: collecting tracking IDs...")
        all_tracking = await collect_all_tracking_ids(page)
        log(f"  Week {week_iso}: {len(all_tracking)} total tracking(s)")

        # Step 2: Navigate back to first page to start detail extraction
        await navigate_with_fallback(page, url, wait_seconds=6)

        # Step 3: For each tracking, fetch detail + Cortex
        investigations = []
        seen = set()

        for i, row in enumerate(all_tracking):
            tid = row["trackingId"]
            if tid in seen:
                continue
            seen.add(tid)

            log(f"    [{i+1}/{len(all_tracking)}] {tid}")
            detail, cortex = await fetch_detail_and_cortex(
                page, tid, skip_cortex=args.skip_cortex
            )

            if detail:
                inv = extract_investigation(detail, tid, target.year, target.week, cortex)
                investigations.append(inv)

        # Save results
        week_dir = args.output_dir / week_slug
        save_json(week_dir / "concessions.json", investigations)
        log(f"  Saved {len(investigations)} concessions to {week_dir}")

        if args.invoke_ingest and investigations:
            run_ingest(week_dir, args.station_code, args.organization_id or "")

        captures.append({
            "week": week_iso,
            "week_dir": str(week_dir),
            "total_tracking": len(all_tracking),
            "extracted": len(investigations),
        })

    await close_browser(browser)
    return captures


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser():
    parser = argparse.ArgumentParser(
        description="Scrape Amazon delivery concessions (DNR) with pagination + Cortex detail."
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--weeks", type=int, default=1, help="Number of weeks to scrape")
    parser.add_argument("--target-week", type=int, default=None)
    parser.add_argument("--target-year", type=int, default=None)
    parser.add_argument("--company-id", type=str, default=None)
    parser.add_argument("--skip-cortex", action="store_true", help="Skip Cortex detail (faster)")
    parser.add_argument("--invoke-ingest", action="store_true")
    parser.add_argument("--station-code", type=str, help="DSPilot station code")
    parser.add_argument("--organization-id", type=str, default=None)
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    if args.invoke_ingest and not args.station_code:
        parser.error("--station-code is required with --invoke-ingest")

    captures = asyncio.run(capture_concessions(args))
    summary = args.output_dir / "captures.json"
    save_json(summary, captures)
    log(f"Summary: {summary}")
    for c in captures:
        log(f"  {c['week']}: {c['extracted']}/{c['total_tracking']} extracted")


if __name__ == "__main__":
    main()
