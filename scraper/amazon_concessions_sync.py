#!/usr/bin/env python3
"""
Scrape Amazon Logistics delivery concessions page for DNR investigations.

Navigates to dsp_delivery_concessions, parses the investigations table,
clicks each tracking ID to extract detail (driver, address, GPS, etc.),
and saves structured JSON for Convex ingestion.
"""

import argparse
import asyncio
import json
import os
import re
import subprocess
import sys
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


def parse_tracking_table(html):
    """Parse the main concessions table to get tracking IDs."""
    soup = BeautifulSoup(html, "html.parser")
    rows = []

    table = soup.find("table")
    if not table:
        return rows

    headers = [th.get_text(strip=True).lower() for th in table.find_all("th")]
    for tr in table.find_all("tr")[1:]:
        cells = tr.find_all(["td", "th"])
        if len(cells) < 2:
            continue

        # Find tracking ID — look for a link or cell with FR/DE/etc pattern
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


def parse_detail_popup(html):
    """Parse the detail popup/page for a single tracking ID.

    The detail page has key-value pairs like:
        Zone de service/DSP: DIF1 / PSUA
        Livreur: Aboubacar Mamadou KAMARA
        ID du transporteur: A3HCU65N5A41UK
        ...
    """
    soup = BeautifulSoup(html, "html.parser")
    detail = {}

    # Try to find key-value pairs in various DOM structures
    # Pattern 1: dt/dd pairs
    for dt in soup.find_all("dt"):
        dd = dt.find_next_sibling("dd")
        if dd:
            key = dt.get_text(strip=True).lower()
            val = dd.get_text(strip=True)
            detail[key] = val

    # Pattern 2: label/value in divs or spans
    for el in soup.find_all(["div", "span", "td"]):
        text = el.get_text(strip=True)
        # Match "Label: Value" or "Label\nValue" patterns
        match = re.match(r"^(.+?):\s*$", text)
        if match:
            next_el = el.find_next_sibling()
            if next_el:
                detail[match.group(1).strip().lower()] = next_el.get_text(strip=True)

    return detail


def extract_investigation(detail, tracking_id, year, week):
    """Extract structured investigation data from parsed detail."""
    def get(keys, default=""):
        for k in keys:
            for dk, dv in detail.items():
                if k in dk.lower():
                    return dv
        return default

    # Parse driver name
    driver_name = get(["livreur", "driver"])
    transporter_id = get(["transporteur", "transporter id"])

    # Parse dates
    delivery_dt = get(["date de livraison", "delivery date"])
    concession_dt = get(["date de concession", "concession date"])

    # Parse scan type
    scan_type = get(["lieu de dépôt", "lieu de depot", "delivery scan", "scan"])

    # Parse address
    street = get(["adresse", "address"])
    postal_code = ""
    city = ""
    # Try to extract postal code and city from address
    addr_match = re.search(r"(\d{5})\s*(.*)", get(["code postal", "postal"]) or street)
    if addr_match:
        postal_code = addr_match.group(1)
        city = addr_match.group(2).strip()

    # Parse GPS
    gps_planned = None
    gps_actual = None
    planned_text = get(["emplacement planifié", "planned location"])
    actual_text = get(["emplacement réel", "actual location"])

    def parse_gps(text):
        match = re.findall(r"(-?\d+\.\d+)°?", text)
        if len(match) >= 2:
            return {"lat": float(match[0]), "lng": float(match[1])}
        return None

    if planned_text:
        gps_planned = parse_gps(planned_text)
    if actual_text:
        gps_actual = parse_gps(actual_text)

    # Parse distance
    distance = None
    dist_text = get(["distance", "mètres", "meters"])
    dist_match = re.search(r"([\d.]+)\s*m", dist_text)
    if dist_match:
        distance = float(dist_match.group(1))

    # Customer notes
    customer_notes = get(["notes du client", "customer notes"]) or None

    return {
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
            "building": get(["bâtiment", "building"]) or None,
            "floor": get(["étage", "floor"]) or None,
            "postalCode": postal_code,
            "city": city,
        },
        "gpsPlanned": gps_planned,
        "gpsActual": gps_actual,
        "gpsDistanceMeters": distance,
        "customerNotes": customer_notes,
        "status": "ongoing",
    }


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
        # Calculate target week
        from datetime import timedelta
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

        # Parse tracking IDs from the main table
        tracking_rows = parse_tracking_table(html)
        log(f"  Week {week_iso}: {len(tracking_rows)} tracking(s) found")

        investigations = []
        for row in tracking_rows:
            tid = row["trackingId"]
            log(f"    Fetching detail for {tid}")

            # Click the tracking ID to open detail
            try:
                link = await page.find(tid, timeout=5)
                if link:
                    await link.click()
                    await asyncio.sleep(3)

                    detail_html = await get_page_html(page)
                    detail = parse_detail_popup(detail_html)
                    inv = extract_investigation(detail, tid, target.year, target.week)
                    investigations.append(inv)

                    # Go back to the table
                    await page.evaluate("window.history.back()")
                    await asyncio.sleep(3)
            except Exception as e:
                log(f"    Error fetching detail for {tid}: {e}")
                continue

        # Save results
        week_dir = args.output_dir / week_slug
        save_json(week_dir / "concessions.json", investigations)
        log(f"  Saved {len(investigations)} investigations to {week_dir}")

        if args.invoke_ingest and investigations:
            run_ingest(week_dir, args.station_code, args.organization_id or "")

        captures.append({
            "week": week_iso,
            "week_dir": str(week_dir),
            "investigations": len(investigations),
        })

    await close_browser(browser)
    return captures


def build_parser():
    parser = argparse.ArgumentParser(
        description="Scrape Amazon delivery concessions for DNR investigations."
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--weeks", type=int, default=1, help="Number of weeks to scrape")
    parser.add_argument("--target-week", type=int, default=None)
    parser.add_argument("--target-year", type=int, default=None)
    parser.add_argument("--company-id", type=str, default=None)
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


if __name__ == "__main__":
    main()
