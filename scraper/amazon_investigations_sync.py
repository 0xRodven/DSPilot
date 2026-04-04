#!/usr/bin/env python3
"""
Scrape Amazon Logistics DNR_Investigations page for formal investigation data.

The DNR_Investigations page shows formal Amazon inquiries (1-8/week) — more
serious than concessions (100+/week). Each investigation may be linked to an
existing concession (DNR) by tracking ID.

Strategy:
1. Navigate to the DNR_Investigations page
2. Parse the table: tracking, driver, dates, reason, verdict
3. Handle pagination
4. Save as JSON for ingestion into Convex
"""

import argparse
import asyncio
import json
import os
import re
from datetime import datetime
from pathlib import Path

import nodriver as uc
from bs4 import BeautifulSoup

BASE_URL = os.getenv("AMAZON_LOGISTICS_BASE_URL", "https://logistics.amazon.fr").rstrip("/")
DEFAULT_OUTPUT_DIR = Path(__file__).parent / "data" / "investigations"
INVESTIGATIONS_URL_TEMPLATE = (
    "{base}/performance?pageId=dsp_dnr_investigations"
    "&station={station}&companyId={company_id}"
    "&tabId=dnr-investigations-weekly-tab"
    "&timeFrame=Weekly&to={week_iso}"
)


def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


# ---------------------------------------------------------------------------
# Browser helpers (shared with concessions scraper)
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


async def click_next_page(page):
    """Click the 'Next page' pagination button."""
    js = """
    (() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
            const label = (btn.getAttribute('aria-label') || '').toLowerCase();
            if (label.includes('next page') || label.includes('page suivante')) {
                btn.click();
                return true;
            }
        }
        for (const btn of buttons) {
            const text = btn.textContent.trim();
            if ((text === '›' || text === '>' || text === '»') &&
                btn.closest('[class*="pagination"], [class*="pager"], nav, [role="navigation"]')) {
                btn.click();
                return true;
            }
        }
        return false;
    })()
    """
    try:
        result = await page.evaluate(js, return_by_value=True)
        if result:
            await asyncio.sleep(4)
            return True
    except Exception:
        pass
    return False


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def get_max_page(html):
    soup = BeautifulSoup(html, "html.parser")
    max_page = 1
    for btn in soup.find_all("button"):
        aria = btn.get("aria-label", "")
        match = re.search(r"(?:Go to |page\s*)(\d+)", aria, re.I)
        if match:
            max_page = max(max_page, int(match.group(1)))
    return max_page


def parse_investigations_table(html):
    """Parse the investigations table.

    Expected columns vary but typically include:
    Tracking ID, Driver, Date, Reason/Type, Status/Verdict
    """
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if not table:
        return []

    header_row = table.find("tr")
    if not header_row:
        return []
    headers = [th.get_text(strip=True).lower() for th in header_row.find_all(["th", "td"])]

    col_map = {}
    for i, h in enumerate(headers):
        if "suivi" in h or "tracking" in h:
            col_map["tracking"] = i
        elif "livreur" in h or "driver" in h or "nom" in h:
            col_map["driver_name"] = i
        elif "transporteur" in h or "transporter" in h:
            col_map["transporter_id"] = i
        elif "raison" in h or "reason" in h or "type" in h:
            col_map["reason"] = i
        elif "verdict" in h or "résultat" in h or "result" in h:
            col_map["verdict"] = i
        elif "statut" in h or "status" in h:
            col_map["status"] = i
        elif "date" in h and "livraison" not in h:
            col_map["investigation_date"] = i
        elif "livraison" in h:
            col_map["delivery_date"] = i

    rows = []
    for tr in table.find_all("tr")[1:]:
        cells = tr.find_all(["td", "th"])
        if len(cells) < 3:
            continue

        vals = [c.get_text(strip=True) for c in cells]

        tracking = vals[col_map.get("tracking", 0)] if "tracking" in col_map else ""
        if not tracking or not re.match(r"^[A-Z]{2}\d{5,}", tracking):
            continue

        row = {
            "trackingId": tracking,
            "driverName": vals[col_map.get("driver_name", 1)] if "driver_name" in col_map else "",
            "transporterId": vals[col_map.get("transporter_id", 2)] if "transporter_id" in col_map else "",
            "investigationReason": vals[col_map.get("reason", 3)] if "reason" in col_map else "",
            "investigationVerdict": vals[col_map.get("verdict", -1)] if "verdict" in col_map else "",
            "investigationDate": vals[col_map.get("investigation_date", -1)] if "investigation_date" in col_map else "",
            "deliveryDatetime": vals[col_map.get("delivery_date", -1)] if "delivery_date" in col_map else "",
        }

        # Determine status from verdict
        verdict_lower = row["investigationVerdict"].lower()
        if "classé" in verdict_lower or "closed" in verdict_lower or "résolu" in verdict_lower:
            row["status"] = "investigation_closed"
        else:
            row["status"] = "under_investigation"

        rows.append(row)

    return rows


def build_investigation_entry(row, year, week):
    """Convert a parsed row into a Convex-ready investigation entry."""
    return {
        "trackingId": row["trackingId"],
        "transporterId": row.get("transporterId", ""),
        "driverName": row.get("driverName", ""),
        "year": year,
        "week": week,
        "deliveryDatetime": row.get("deliveryDatetime", ""),
        "concessionDatetime": row.get("investigationDate", ""),
        "investigationReason": row.get("investigationReason", ""),
        "investigationDate": row.get("investigationDate", ""),
        "investigationVerdict": row.get("investigationVerdict", ""),
        "status": row.get("status", "under_investigation"),
    }


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def save_json(target, data):
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return target


def run_ingest(output_dir, station_code, organization_id):
    import subprocess
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
    captures = []

    for week_offset in range(args.weeks):
        from isoweek import Week

        target = Week.thisweek() - week_offset
        if args.target_week and args.target_year and week_offset == 0:
            target = Week(args.target_year, args.target_week)

        week_iso = f"{target.year}-W{target.week:02d}"
        week_slug = f"week-{target.week:02d}-{target.year}"

        station_filter = args.station_filter or "DIF1"
        url = INVESTIGATIONS_URL_TEMPLATE.format(
            base=BASE_URL, station=station_filter, company_id=company_id, week_iso=week_iso
        )
        await navigate_with_fallback(page, url, wait_seconds=6)

        html = await get_page_html(page)
        if looks_like_login_page(html):
            raise RuntimeError("investigations_page_redirected_to_login")

        # Collect rows with pagination
        all_rows = []
        max_page = get_max_page(html)
        log(f"  Week {week_iso}: {max_page} page(s) detected")

        for pg in range(1, max_page + 1):
            if pg > 1:
                clicked = await click_next_page(page)
                if not clicked:
                    log(f"    Could not navigate to page {pg}, stopping")
                    break

            html = await get_page_html(page)
            rows = parse_investigations_table(html)

            new_max = get_max_page(html)
            if new_max > max_page:
                log(f"    Updated max pages: {max_page} → {new_max}")
                max_page = new_max

            log(f"    Page {pg}: {len(rows)} investigation(s)")
            all_rows.extend(rows)

        log(f"  Week {week_iso}: {len(all_rows)} total investigation(s)")

        entries = [build_investigation_entry(row, target.year, target.week) for row in all_rows]

        week_dir = args.output_dir / week_slug
        save_json(week_dir / "investigations.json", entries)
        log(f"  Saved {len(entries)} investigations to {week_dir}")

        if args.invoke_ingest and entries:
            run_ingest(week_dir, args.station_code, args.organization_id or "")

        captures.append({
            "week": week_iso,
            "week_dir": str(week_dir),
            "total": len(all_rows),
        })

    await close_browser(browser)
    return captures


def build_parser():
    parser = argparse.ArgumentParser(
        description="Scrape Amazon DNR Investigations with pagination."
    )
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument("--weeks", type=int, default=1)
    parser.add_argument("--target-week", type=int, default=None)
    parser.add_argument("--target-year", type=int, default=None)
    parser.add_argument("--company-id", type=str, default=None)
    parser.add_argument("--station-filter", type=str, default="DIF1")
    parser.add_argument("--invoke-ingest", action="store_true")
    parser.add_argument("--station-code", type=str)
    parser.add_argument("--organization-id", type=str, default=None)
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    if args.invoke_ingest and not args.station_code:
        parser.error("--station-code is required with --invoke-ingest")

    captures = asyncio.run(capture_investigations(args))
    summary = args.output_dir / "captures.json"
    save_json(summary, captures)
    log(f"Summary: {summary}")
    for c in captures:
        log(f"  {c['week']}: {c['total']} investigations")


if __name__ == "__main__":
    main()
