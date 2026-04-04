#!/usr/bin/env python3
"""
Scrape Amazon DNR Investigations from weekly S3 HTML reports.

Unlike concessions (live page), investigations are static HTML files hosted on S3.
The flow:
1. Navigate to the Amazon performance page
2. Find the signed S3 link for DNR_Investigations_*.html
3. Download the HTML via requests (using the signed URL)
4. Parse the table: Tracking ID, Delivery Datetime, Scan Type, etc.
5. Save as JSON for ingestion into Convex

The S3 URL changes weekly and includes a temporary AWS signature.
The link is found on: /performance?station={station}&companyId={company_id}
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
import requests
from bs4 import BeautifulSoup

BASE_URL = os.getenv("AMAZON_LOGISTICS_BASE_URL", "https://logistics.amazon.fr").rstrip("/")
DEFAULT_OUTPUT_DIR = Path(__file__).parent / "data" / "investigations"
PERFORMANCE_URL_TEMPLATE = (
    "{base}/performance?station={station}&companyId={company_id}"
)


def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


# ---------------------------------------------------------------------------
# Step 1: Get signed S3 URL via browser
# ---------------------------------------------------------------------------

async def get_investigations_s3_url(browser_page, station, company_id):
    """Navigate to performance page and extract the DNR_Investigations S3 link."""
    url = PERFORMANCE_URL_TEMPLATE.format(
        base=BASE_URL, station=station, company_id=company_id
    )
    log(f"Opening {url}")

    try:
        await asyncio.wait_for(browser_page.get(url), timeout=30)
    except asyncio.TimeoutError:
        await asyncio.wait_for(
            browser_page.evaluate(f"window.location.href = {json.dumps(url)}"), timeout=5
        )
    await asyncio.sleep(6)

    html = await asyncio.wait_for(browser_page.get_content(), timeout=20)
    soup = BeautifulSoup(html, "html.parser")

    for a in soup.find_all("a"):
        href = a.get("href", "")
        if "DNR_Investigations" in href and "s3" in href.lower():
            log(f"  Found investigations link: {href[:80]}...")
            return href

    log("  No DNR_Investigations link found on performance page")
    return None


# ---------------------------------------------------------------------------
# Step 2: Download HTML via requests (signed URL, no browser needed)
# ---------------------------------------------------------------------------

def download_s3_report(s3_url, output_path):
    """Download the S3 HTML report using the signed URL."""
    log(f"Downloading S3 report...")
    resp = requests.get(s3_url, timeout=30)
    resp.raise_for_status()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(resp.text, encoding="utf-8")
    log(f"  Saved {len(resp.text)} bytes to {output_path}")
    return resp.text


# ---------------------------------------------------------------------------
# Step 3: Parse the investigations HTML table
# ---------------------------------------------------------------------------

def parse_investigations_html(html):
    """Parse the S3 investigations report.

    Known columns:
    Time Left | Tracking ID | Actual Delivery Datetime | Delivery Scan |
    Delivery Completion | Location/Recipient | Additional Details |
    Building/Property Details | Building Number | Building Floor
    """
    soup = BeautifulSoup(html, "html.parser")
    tables = soup.find_all("table")
    if not tables:
        log("  No tables found in report")
        return []

    table = tables[0]
    header_row = table.find("tr")
    if not header_row:
        return []

    headers = [th.get_text(strip=True).lower() for th in header_row.find_all(["th", "td"])]
    log(f"  Headers: {headers}")

    # Map columns
    col_map = {}
    for i, h in enumerate(headers):
        if "tracking" in h:
            col_map["tracking"] = i
        elif "delivery datetime" in h or "actual delivery" in h:
            col_map["delivery_datetime"] = i
        elif "scan" in h or "delivery scan" in h:
            col_map["scan_type"] = i
        elif "completion" in h:
            col_map["completion"] = i
        elif "location" in h or "recipient" in h:
            col_map["location"] = i
        elif "additional" in h:
            col_map["additional"] = i
        elif "building" in h and "number" in h:
            col_map["building_number"] = i
        elif "building" in h and "floor" in h:
            col_map["building_floor"] = i
        elif "building" in h or "property" in h:
            col_map["building_details"] = i
        elif "time" in h and "left" in h:
            col_map["time_left"] = i

    rows = []
    for tr in table.find_all("tr")[1:]:
        cells = tr.find_all(["td", "th"])
        if len(cells) < 2:
            continue
        vals = [c.get_text(strip=True) for c in cells]

        tracking = vals[col_map.get("tracking", 1)] if "tracking" in col_map else ""
        if not tracking or len(tracking) < 5:
            continue

        delivery_dt = vals[col_map.get("delivery_datetime", 2)] if "delivery_datetime" in col_map else ""
        scan_type = vals[col_map.get("scan_type", 3)] if "scan_type" in col_map else "UNKNOWN"
        location = vals[col_map.get("location", 5)] if "location" in col_map else ""
        additional = vals[col_map.get("additional", 6)] if "additional" in col_map else ""
        time_left = vals[col_map.get("time_left", 0)] if "time_left" in col_map else ""

        # Determine status from "time left" or other clues
        status = "under_investigation"
        if time_left and ("closed" in time_left.lower() or "0" in time_left):
            status = "investigation_closed"

        row = {
            "trackingId": tracking,
            "deliveryDatetime": delivery_dt,
            "scanType": scan_type,
            "location": location,
            "additionalDetails": additional,
            "timeLeft": time_left,
            "status": status,
        }
        rows.append(row)

    return rows


# ---------------------------------------------------------------------------
# Step 4: Build investigation entries for Convex ingestion
# ---------------------------------------------------------------------------

def build_entries(rows, year, week, station_code):
    """Convert parsed rows into Convex-ready investigation entries."""
    entries = []
    for row in rows:
        entries.append({
            "trackingId": row["trackingId"],
            "transporterId": "",  # Not available in S3 report
            "driverName": "",  # Not available — will be resolved by Convex via trackingId match
            "year": year,
            "week": week,
            "deliveryDatetime": row["deliveryDatetime"],
            "concessionDatetime": row["deliveryDatetime"],  # Use delivery date as fallback
            "investigationReason": row.get("additionalDetails", ""),
            "investigationDate": row["deliveryDatetime"],
            "investigationVerdict": row.get("timeLeft", ""),
            "status": row["status"],
        })
    return entries


def save_json(target, data):
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return target


def run_ingest(output_dir, station_code, organization_id):
    cmd = [
        "npx", "tsx", "scripts/ingest-investigations.ts",
        "--artifacts-dir", str(output_dir),
        "--station-code", station_code,
        "--organization-id", organization_id,
    ]
    log(f"  Running ingest: {' '.join(cmd)}")
    subprocess.run(cmd, check=True, cwd=Path(__file__).resolve().parents[1])


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def capture_investigations(args):
    from amazon_deep_scraper import close_browser, load_cookies_and_login, looks_like_login_page, setup_browser

    browser = await setup_browser()
    page = await load_cookies_and_login(browser)
    if not page:
        await close_browser(browser)
        raise SystemExit(1)

    company_id = args.company_id or os.getenv("AMAZON_COMPANY_ID", "")
    station = args.station_filter or "DIF1"

    # Step 1: Get the signed S3 URL
    s3_url = await get_investigations_s3_url(page, station, company_id)
    await close_browser(browser)

    if not s3_url:
        log("No investigations report found — skipping")
        return []

    # Step 2: Download the HTML
    from isoweek import Week
    target = Week.thisweek()
    if args.target_week and args.target_year:
        target = Week(args.target_year, args.target_week)

    week_iso = f"{target.year}-W{target.week:02d}"
    week_slug = f"week-{target.week:02d}-{target.year}"
    week_dir = args.output_dir / week_slug

    html_path = week_dir / "investigations-raw.html"
    html_content = download_s3_report(s3_url, html_path)

    # Step 3: Parse
    rows = parse_investigations_html(html_content)
    log(f"  Parsed {len(rows)} investigation(s)")

    for row in rows:
        log(f"    {row['trackingId']} — {row['scanType']} — {row['status']}")

    # Step 4: Build entries and save
    entries = build_entries(rows, target.year, target.week, args.station_code or "FR-PSUA-DIF1")
    save_json(week_dir / "investigations.json", entries)
    log(f"  Saved {len(entries)} investigations to {week_dir}")

    # Step 5: Ingest into Convex
    if args.invoke_ingest and entries:
        run_ingest(week_dir, args.station_code, args.organization_id or "")

    return [{
        "week": week_iso,
        "week_dir": str(week_dir),
        "total": len(rows),
    }]


def build_parser():
    parser = argparse.ArgumentParser(
        description="Download and parse Amazon DNR Investigations from S3 reports."
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--target-week", type=int, default=None)
    parser.add_argument("--target-year", type=int, default=None)
    parser.add_argument("--company-id", type=str, default=None)
    parser.add_argument("--station-filter", type=str, default="DIF1")
    parser.add_argument("--invoke-ingest", action="store_true")
    parser.add_argument("--station-code", type=str, default="FR-PSUA-DIF1")
    parser.add_argument("--organization-id", type=str, default=None)
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    captures = asyncio.run(capture_investigations(args))
    if captures:
        summary = args.output_dir / "captures.json"
        save_json(summary, captures)
        log(f"Summary: {summary}")
        for c in captures:
            log(f"  {c['week']}: {c['total']} investigations")
    else:
        log("No investigations captured")


if __name__ == "__main__":
    main()
