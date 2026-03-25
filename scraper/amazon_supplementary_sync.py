#!/usr/bin/env python3
"""
Focused Amazon Logistics automation for the "Rapports supplementaires" page.

This flow is more reliable than scraping Quality/Associate tables because Amazon
already exposes signed report download links from this view.
"""

import argparse
import asyncio
import json
import os
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

from bs4 import BeautifulSoup

BASE_URL = os.getenv("AMAZON_LOGISTICS_BASE_URL", "https://logistics.amazon.fr").rstrip("/")
DEFAULT_OUTPUT_DIR = Path(__file__).parent / "data" / "supplementary-sync"
REPORTS_URL = f"{BASE_URL}/performance?pageId=dsp_supp_reports&navMenuVariant=external"
DOWNLOADABLE_REPORT_TYPES = {
    "daily_html",
    "dwc_iadc_html",
    "dnr_investigations_html",
}


def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}", flush=True)


def normalize_text(text):
    return " ".join((text or "").replace("\xa0", " ").split())


def classify_report(name, url):
    if "Daily-Report" in name:
        return "daily_html"
    if "DWC-IADC-Report" in name:
        return "dwc_iadc_html"
    if "DNR_Investigations" in name:
        return "dnr_investigations_html"
    if "Driver Support Dashboard" in name:
        return "driver_support_dashboard"
    if "Quality Insights" in name:
        return "quality_insights_dashboard"
    if "/interactive-report" in url:
        return "interactive_dashboard"
    return "other"


def parse_week_metadata(soup):
    heading = soup.find("h5")
    if heading:
        match = __import__("re").search(r"semaine\s+(\d+),\s*(\d{4})", heading.get_text(" ", strip=True), __import__("re").I)
        if match:
            return {
                "week": int(match.group(1)),
                "year": int(match.group(2)),
                "week_label": f"W{match.group(1)}/{match.group(2)}",
            }

    picker = soup.find(attrs={"data-testid": "week-picker"})
    if picker:
        text = picker.get_text(" ", strip=True)
        match = __import__("re").search(r"Semaine\s+(\d+)", text, __import__("re").I)
        if match:
            return {
                "week": int(match.group(1)),
                "year": None,
                "week_label": f"W{match.group(1)}",
            }

    return {
        "week": None,
        "year": None,
        "week_label": None,
    }


def parse_station_code(soup):
    for node in soup.select("[mdn-select-value]"):
        text = normalize_text(node.get_text(" ", strip=True))
        if text and len(text) <= 8 and text.isupper():
            return text
    return None


def filename_from_url(url):
    parsed = urllib.parse.urlparse(url)
    return Path(parsed.path).name or "report.html"


def extract_report_manifest(html, source):
    soup = BeautifulSoup(html, "html.parser")
    week_metadata = parse_week_metadata(soup)
    station_code = parse_station_code(soup)

    reports = []
    for row in soup.select("table tbody tr"):
        link = row.select_one("td[data-testid='name'] a[href]")
        created = row.select_one("td[data-testid='formattedCreationDate']")
        if not link:
            continue

        name = normalize_text(link.get_text(" ", strip=True))
        href = link.get("href", "")
        absolute_url = urllib.parse.urljoin(BASE_URL, href)
        report_type = classify_report(name, absolute_url)

        reports.append({
            "name": name,
            "type": report_type,
            "url": absolute_url,
            "filename": link.get("download") or filename_from_url(absolute_url),
            "created_at": normalize_text(created.get_text(" ", strip=True)) if created else None,
            "downloadable": report_type in DOWNLOADABLE_REPORT_TYPES,
        })

    return {
        "source": str(source),
        "station_code": station_code,
        **week_metadata,
        "reports": reports,
        "downloadable_count": sum(1 for report in reports if report["downloadable"]),
    }


def save_text(target, content):
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return target


def save_json(target, data):
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return target


def download_reports(manifest, output_dir):
    downloaded = []
    for report in manifest["reports"]:
        if not report["downloadable"]:
            continue

        target = output_dir / report["filename"]
        urllib.request.urlretrieve(report["url"], target)
        downloaded.append(str(target))
        log(f"  Downloaded {target.name}")

    return downloaded


def build_week_slug(manifest):
    if manifest.get("week") is not None and manifest.get("year") is not None:
        return f"week-{manifest['week']:02d}-{manifest['year']}"
    if manifest.get("week_label"):
        return manifest["week_label"].lower().replace("/", "-")
    return datetime.utcnow().strftime("capture-%Y%m%d-%H%M%S")


def run_ingest(output_dir, station_code, expected_amazon_station_code):
    cmd = [
        "npm",
        "run",
        "amazon:ingest",
        "--",
        "--station-code",
        station_code,
        "--artifacts-dir",
        str(output_dir),
    ]
    if expected_amazon_station_code:
        cmd.extend(["--expected-amazon-station-code", expected_amazon_station_code])

    log(f"  Running ingest: {' '.join(cmd)}")
    subprocess.run(cmd, check=True, cwd=Path(__file__).resolve().parents[1])


async def capture_browser_weeks(args):
    from amazon_deep_scraper import load_cookies_and_login, setup_browser

    browser = await setup_browser()
    page = await load_cookies_and_login(browser)
    if not page:
        browser.stop()
        raise SystemExit(1)

    await page.get(REPORTS_URL)
    await asyncio.sleep(5)

    seen_week_labels = set()
    captures = []

    for index in range(args.weeks):
        html = await page.get_content()
        manifest = extract_report_manifest(html, f"browser:{REPORTS_URL}")
        week_slug = build_week_slug(manifest)
        week_dir = args.output_dir / week_slug

        save_text(week_dir / "supplementary_reports.html", html)
        save_json(week_dir / "manifest.json", manifest)

        log(f"Week capture {index + 1}/{args.weeks}: {manifest.get('week_label') or week_slug}")
        log(f"  Reports found: {len(manifest['reports'])} ({manifest['downloadable_count']} downloadable)")

        if args.download:
            download_reports(manifest, week_dir)

        if args.invoke_ingest:
            run_ingest(
                week_dir,
                station_code=args.station_code,
                expected_amazon_station_code=args.expected_amazon_station_code or manifest.get("station_code"),
            )

        captures.append({"week_dir": str(week_dir), "manifest": manifest})

        current_label = manifest.get("week_label")
        if not current_label or current_label in seen_week_labels:
            break
        seen_week_labels.add(current_label)

        if index + 1 >= args.weeks:
            break

        previous_button = await page.find("button.css-px7qg4", timeout=3)
        if not previous_button:
            log("  No previous-week button found, stopping")
            break

        await previous_button.click()
        await asyncio.sleep(4)

        updated_html = await page.get_content()
        updated_manifest = extract_report_manifest(updated_html, f"browser:{REPORTS_URL}")
        if updated_manifest.get("week_label") == current_label:
            log("  Week label did not change after click, stopping")
            break

    browser.stop()
    return captures


def parse_local_html(args):
    html = args.html_path.read_text(encoding="utf-8")
    manifest = extract_report_manifest(html, args.html_path)
    week_dir = args.output_dir / build_week_slug(manifest)

    save_text(week_dir / args.html_path.name, html)
    save_json(week_dir / "manifest.json", manifest)

    log(f"Parsed local HTML: {args.html_path}")
    log(f"  Station: {manifest.get('station_code')}")
    log(f"  Week: {manifest.get('week_label')}")
    log(f"  Reports: {len(manifest['reports'])}")

    if args.download:
        download_reports(manifest, week_dir)

    return [{"week_dir": str(week_dir), "manifest": manifest}]


def build_parser():
    parser = argparse.ArgumentParser(description="Extract and optionally download Amazon Logistics supplementary reports.")
    parser.add_argument("--html-path", type=Path, help="Parse a saved supplementary_reports HTML file instead of using the browser")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directory where manifests and downloaded reports are stored")
    parser.add_argument("--weeks", type=int, default=1, help="Number of weeks to attempt in browser mode")
    parser.add_argument("--no-download", action="store_true", help="Do not download signed report files")
    parser.add_argument("--invoke-ingest", action="store_true", help="Call npm run amazon:ingest after downloads")
    parser.add_argument("--station-code", help="DSPilot station code required when --invoke-ingest is used")
    parser.add_argument("--expected-amazon-station-code", help="Expected Amazon station code passed to the ingest CLI")
    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.download = not args.no_download

    if args.invoke_ingest and not args.station_code:
        parser.error("--station-code is required with --invoke-ingest")

    args.output_dir.mkdir(parents=True, exist_ok=True)

    if args.html_path:
        captures = parse_local_html(args)
    else:
        captures = asyncio.run(capture_browser_weeks(args))

    summary_path = args.output_dir / "captures.json"
    save_json(summary_path, captures)
    log(f"Summary written to {summary_path}")


if __name__ == "__main__":
    main()
