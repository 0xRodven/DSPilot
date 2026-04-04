#!/usr/bin/env python3
"""
Scrape Amazon Logistics delivery concessions page for DNR data.

Discovery: The concessions table already has ALL key data in the rows:
  Tracking ID, Station, DSP, Delivery Date, Concession Date, Transporter ID, Driver Name

Clicking a tracking adds: Lieu de dépôt, Address, GPS, Distance, Customer Notes.
Cortex link adds: Delivery type classification.

Strategy:
1. Parse the main table for all rows (bulk data without clicking)
2. For each row, click to get detail (address, GPS, scan type)
3. Optionally click Cortex for delivery type
4. Handle pagination across multiple pages
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
# Parsing — Main table (bulk, no click needed)
# ---------------------------------------------------------------------------

def parse_concessions_table(html):
    """Parse the main concessions table.

    Headers: Numéro de suivi | Zone de service | DSP | Date de livraison |
             Date de concession | Livreur | Nom du livreur

    Each row = one concession with most data already available.
    """
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if not table:
        return []

    # Get header row to map columns
    header_row = table.find("tr")
    if not header_row:
        return []
    headers = [th.get_text(strip=True).lower() for th in header_row.find_all(["th", "td"])]

    # Map column indices
    col_map = {}
    for i, h in enumerate(headers):
        if "suivi" in h or "tracking" in h:
            col_map["tracking"] = i
        elif "zone" in h or "station" in h:
            col_map["station"] = i
        elif "dsp" in h:
            col_map["dsp"] = i
        elif "livraison" in h and "date" in h:
            col_map["delivery_date"] = i
        elif "concession" in h and "date" in h:
            col_map["concession_date"] = i
        elif "livreur" in h and "nom" not in h:
            col_map["transporter_id"] = i
        elif "nom" in h:
            col_map["driver_name"] = i

    rows = []
    for tr in table.find_all("tr")[1:]:  # skip header
        cells = tr.find_all(["td", "th"])
        if len(cells) < 4:
            continue

        vals = [c.get_text(strip=True) for c in cells]

        # Skip if this looks like a detail section (key-value pair, 2 cells)
        if len(cells) == 2:
            continue

        tracking = vals[col_map.get("tracking", 0)] if "tracking" in col_map else ""
        if not tracking or not re.match(r"^[A-Z]{2}\d{5,}", tracking):
            continue

        row = {
            "trackingId": tracking,
            "station": vals[col_map.get("station", 1)] if "station" in col_map else "",
            "dsp": vals[col_map.get("dsp", 2)] if "dsp" in col_map else "",
            "deliveryDatetime": vals[col_map.get("delivery_date", 3)] if "delivery_date" in col_map else "",
            "concessionDatetime": vals[col_map.get("concession_date", 4)] if "concession_date" in col_map else "",
            "transporterId": vals[col_map.get("transporter_id", 5)] if "transporter_id" in col_map else "",
            "driverName": vals[col_map.get("driver_name", 6)] if "driver_name" in col_map else "",
        }
        rows.append(row)

    return rows


def parse_detail_section(html):
    """Parse the detail section that appears after clicking a tracking ID.

    The detail is rendered as 2-column table rows (key-value pairs) below the main table.
    """
    soup = BeautifulSoup(html, "html.parser")
    detail = {}

    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            cells = tr.find_all(["td", "th"])
            # Detail rows have exactly 2 cells: label + value
            if len(cells) == 2:
                key = cells[0].get_text(strip=True).lower()
                val = cells[1].get_text(" ", strip=True)
                if key and val:
                    detail[key] = val

    return detail


def parse_detail_section_last(html):
    """Parse ONLY the last detail section (Amazon appends detail rows on each click).

    Each click adds ~10 key-value rows. We take the last 10 two-cell rows
    which correspond to the most recently clicked tracking.
    """
    soup = BeautifulSoup(html, "html.parser")
    all_kv = []

    for table in soup.find_all("table"):
        for tr in table.find_all("tr"):
            cells = tr.find_all(["td", "th"])
            if len(cells) == 2:
                key = cells[0].get_text(strip=True).lower()
                val = cells[1].get_text(" ", strip=True)
                if key and val:
                    all_kv.append((key, val))

    # Take only the last 10 rows (= current detail)
    last_kv = all_kv[-10:] if len(all_kv) > 10 else all_kv
    return dict(last_kv)


def get_max_page(html):
    """Find the highest page number from pagination buttons.

    Amazon uses: aria-label="Go to page N" for each page button.
    """
    soup = BeautifulSoup(html, "html.parser")
    max_page = 1
    for btn in soup.find_all("button"):
        aria = btn.get("aria-label", "")
        match = re.search(r"(?:Go to |page\s*)(\d+)", aria, re.I)
        if match:
            max_page = max(max_page, int(match.group(1)))
    return max_page


def enrich_with_detail(base_row, detail):
    """Merge detail popup data into the base row from the main table."""

    def get(keys, default=""):
        for k in keys:
            for dk, dv in detail.items():
                if k in dk:
                    return dv
        return default

    # Scan type
    scan_type = get(["lieu de dépôt", "lieu de depot"])
    if scan_type:
        base_row["scanType"] = scan_type

    # Address
    addr_raw = get(["détails de la livraison", "adresse"])
    if addr_raw:
        # Parse multi-part address: "Adresse 18 R du Faubourg Poissonnière 51B54, Escalier cour,"
        # Remove leading "Adresse" label
        addr_clean = re.sub(r"^Adresse\s*", "", addr_raw).strip()
        parts = [p.strip() for p in addr_clean.split(",") if p.strip()]

        street = parts[0] if parts else ""
        building = parts[1] if len(parts) > 1 else None

        # Extract postal code + city
        postal_code = ""
        city = ""
        for part in parts:
            pc_match = re.search(r"\b(\d{5})\b", part)
            if pc_match:
                postal_code = pc_match.group(1)
                city = re.sub(r"\b\d{5}\b", "", part).strip()

        # Also check standalone fields
        if not postal_code:
            for p in parts:
                if re.match(r"^\d{5}$", p.strip()):
                    postal_code = p.strip()
                elif not city and p.strip().isalpha():
                    city = p.strip()

        base_row["address"] = {
            "street": street,
            "building": building,
            "floor": None,
            "postalCode": postal_code,
            "city": city,
        }

    # GPS
    planned_text = get(["emplacement planifié"])
    actual_text = get(["emplacement réel"])

    def parse_gps(text):
        coords = re.findall(r"(-?\d+\.\d+)°?", text)
        if len(coords) >= 2:
            return {"lat": float(coords[0]), "lng": float(coords[1])}
        return None

    if planned_text:
        gps = parse_gps(planned_text)
        if gps:
            base_row["gpsPlanned"] = gps
    if actual_text:
        gps = parse_gps(actual_text)
        if gps:
            base_row["gpsActual"] = gps

    # Distance
    dist_text = get(["distance entre"])
    dist_match = re.search(r"([\d.]+)\s*m", dist_text)
    if dist_match:
        base_row["gpsDistanceMeters"] = float(dist_match.group(1))

    # Customer notes
    notes = get(["notes du client", "customer notes"])
    if notes and notes.lower() not in ["", "group stop"]:
        base_row["customerNotes"] = notes

    return base_row


def build_investigation(row, year, week):
    """Convert a parsed row into a Convex-ready investigation object."""
    return {
        "trackingId": row["trackingId"],
        "transporterId": row.get("transporterId", ""),
        "driverName": row.get("driverName", ""),
        "year": year,
        "week": week,
        "deliveryDatetime": row.get("deliveryDatetime", ""),
        "concessionDatetime": row.get("concessionDatetime", ""),
        "scanType": row.get("scanType", "UNKNOWN"),
        "address": row.get("address", {
            "street": "", "building": None, "floor": None,
            "postalCode": "", "city": "",
        }),
        "gpsPlanned": row.get("gpsPlanned"),
        "gpsActual": row.get("gpsActual"),
        "gpsDistanceMeters": row.get("gpsDistanceMeters"),
        "customerNotes": row.get("customerNotes"),
        "deliveryType": row.get("deliveryType"),
        "status": "ongoing",
    }


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
# Browser interactions
# ---------------------------------------------------------------------------

async def click_page(page, page_num):
    """Click a specific page number button. Returns True if clicked."""
    selector = f'button[aria-label="Go to page {page_num}"]'
    try:
        btn = await page.select(selector, timeout=5)
        if btn:
            await btn.click()
            await asyncio.sleep(4)
            return True
    except Exception:
        pass

    # Fallback: find button by text content
    try:
        btn = await page.find(str(page_num), timeout=3)
        if btn:
            tag = await btn.get_js_attributes("tagName")
            if tag and tag.lower() == "button":
                await btn.click()
                await asyncio.sleep(4)
                return True
    except Exception:
        pass

    return False


async def fetch_detail_for_tracking(page, tracking_id):
    """Click a tracking ID — detail appears inline on the same page.

    Important: Each click APPENDS detail rows to the DOM (they accumulate).
    We take the LAST 10 two-cell rows as the current detail.
    """
    try:
        link = await page.find(tracking_id, timeout=5)
        if not link:
            return None

        await link.click()
        await asyncio.sleep(4)  # Amazon needs time to render detail

        html = await get_page_html(page)
        detail = parse_detail_section_last(html)

        return detail
    except Exception as e:
        log(f"      Detail error for {tracking_id}: {e}")
        return None


# ---------------------------------------------------------------------------
# Main scraping flow
# ---------------------------------------------------------------------------

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

        # Collect rows page by page, with inline detail extraction
        all_rows = []
        html = await get_page_html(page)
        max_page = get_max_page(html)
        log(f"  Week {week_iso}: {max_page} page(s) detected")

        for pg in range(1, max_page + 1):
            # Navigate to the clean page (no accumulated detail rows)
            if pg == 1:
                pass  # Already on page 1 from initial navigation
            else:
                # Re-navigate to URL first (detail clicks pollute the DOM)
                await navigate_with_fallback(page, url, wait_seconds=5)
                clicked = await click_page(page, pg)
                if not clicked:
                    log(f"    Could not navigate to page {pg}, stopping")
                    break

            html = await get_page_html(page)
            rows = parse_concessions_table(html)
            log(f"    Page {pg}: {len(rows)} concession(s)")

            # Extract detail for each row on this page (inline click)
            if not args.table_only:
                for i, row in enumerate(rows):
                    tid = row["trackingId"]
                    global_idx = len(all_rows) + i + 1
                    log(f"      [{global_idx}] Detail for {tid}")
                    detail = await fetch_detail_for_tracking(page, tid)
                    if detail:
                        enrich_with_detail(row, detail)

            all_rows.extend(rows)

        log(f"  Week {week_iso}: {len(all_rows)} total concession(s)")

        # Phase 3: Build investigation objects
        investigations = [
            build_investigation(row, target.year, target.week)
            for row in all_rows
        ]

        # Save results
        week_dir = args.output_dir / week_slug
        save_json(week_dir / "concessions.json", investigations)
        log(f"  Saved {len(investigations)} concessions to {week_dir}")

        if args.invoke_ingest and investigations:
            run_ingest(week_dir, args.station_code, args.organization_id or "")

        captures.append({
            "week": week_iso,
            "week_dir": str(week_dir),
            "total": len(all_rows),
            "with_detail": sum(1 for r in all_rows if "scanType" in r),
        })

    await close_browser(browser)
    return captures


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser():
    parser = argparse.ArgumentParser(
        description="Scrape Amazon delivery concessions (DNR) with pagination + detail."
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--weeks", type=int, default=1, help="Number of weeks to scrape")
    parser.add_argument("--target-week", type=int, default=None)
    parser.add_argument("--target-year", type=int, default=None)
    parser.add_argument("--company-id", type=str, default=None)
    parser.add_argument("--table-only", action="store_true",
                        help="Only parse the main table (fast, no detail clicks)")
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
        log(f"  {c['week']}: {c['total']} concessions ({c['with_detail']} with detail)")


if __name__ == "__main__":
    main()
