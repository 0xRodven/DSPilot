#!/usr/bin/env python3
"""
Amazon Logistics Scraper v2 — DSPilot
Navigates the SPA and intercepts all XHR/API responses.
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path

import nodriver as uc

DATA_DIR = Path(__file__).parent / "data"
COOKIES_FILE = Path("/root/.secrets/amazon-logistics-cookies.json")
BASE_URL = "https://logistics.amazon.fr"

# Collect ALL network responses
all_responses = []


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def save(data, name, ext="json"):
    path = DATA_DIR / f"{name}.{ext}"
    if ext == "json":
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False, default=str), encoding='utf-8')
    else:
        path.write_text(str(data), encoding='utf-8')
    log(f"  -> {path.name} ({path.stat().st_size:,} bytes)")


async def main():
    log("=" * 60)
    log("Amazon Logistics Scraper v2")
    log("=" * 60)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Launch
    browser = await uc.start(
        headless=True,
        browser_args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
                       "--window-size=1920,1080", "--lang=fr-FR"],
    )
    page = browser.main_tab

    # Load cookies
    log("Loading cookies...")
    with open(COOKIES_FILE) as f:
        cookies = json.load(f)

    await page.get("https://www.amazon.fr")
    await asyncio.sleep(2)
    for c in cookies:
        try:
            await page.send(uc.cdp.network.set_cookie(
                name=c["name"], value=c["value"], domain=c["domain"],
                path=c.get("path", "/"), secure=c.get("secure", True),
                http_only=c.get("httpOnly", False),
            ))
        except:
            pass
    log(f"  {len(cookies)} cookies loaded")

    # Enable network capture
    log("Enabling network capture...")
    await page.send(uc.cdp.network.enable())

    captured_bodies = []

    async def on_response(event):
        """Capture every response — we'll filter later."""
        url = str(event.response.url)
        status = event.response.status
        mime = event.response.mime_type or ""

        # Skip images, fonts, CSS
        skip = ['.png', '.jpg', '.gif', '.svg', '.woff', '.ttf', '.css', 'rum.us-east']
        if any(s in url.lower() for s in skip):
            return

        entry = {
            "url": url,
            "status": status,
            "mime": mime,
            "request_id": event.request_id.to_json() if hasattr(event.request_id, 'to_json') else str(event.request_id),
            "timestamp": datetime.now().isoformat(),
        }
        all_responses.append(entry)

        # Try to get body for interesting responses
        interesting = ['json', 'api', 'graphql', 'scorecard', 'performance',
                       'driver', 'associate', 'delivery', 'fleet', 'metric',
                       'station', 'report', 'score', 'week', 'harmony',
                       'cortex', 'operations', 'dwc', 'iadc', 'dnr']

        if any(kw in url.lower() or kw in mime.lower() for kw in interesting):
            try:
                body_result = await page.send(
                    uc.cdp.network.get_response_body(event.request_id)
                )
                if body_result and body_result.body:
                    body_text = body_result.body
                    entry["body_length"] = len(body_text)
                    entry["body_preview"] = body_text[:500]

                    # Try to parse as JSON
                    try:
                        entry["body_json"] = json.loads(body_text)
                    except:
                        entry["body_raw"] = body_text[:10000]

                    captured_bodies.append(entry)
                    log(f"  XHR: {url[:100]} ({len(body_text):,} bytes)")
            except:
                pass

    page.add_handler(uc.cdp.network.ResponseReceived, on_response)

    # ==========================================
    # Navigate to DSP Console
    # ==========================================
    log("\n=== Navigating to DSP Console ===")
    await page.get(f"{BASE_URL}/dspconsole")
    await asyncio.sleep(8)  # Let SPA fully load

    content = await page.get_content()
    save(content, "01_dspconsole", "html")
    await page.save_screenshot(str(DATA_DIR / "01_dspconsole.png"))
    log(f"  Dashboard: {len(content):,} chars")

    # ==========================================
    # Performance pages — the main data source
    # ==========================================
    pages_to_scrape = [
        ("/performance?pageId=dsp_dashboard_overview", "02_performance_overview"),
        ("/performance?pageId=dsp_quality&navMenuVariant=external", "03_quality_dwc"),
        ("/performance?pageId=dsp_safety&navMenuVariant=external", "04_safety"),
        ("/performance?pageId=dsp_supp_reports&navMenuVariant=external", "05_reports"),
        ("/performance/delivery-overview", "06_delivery_overview"),
        ("/performance/associate-overview", "07_associate_overview"),
        ("/performance/station-metrics", "08_station_metrics"),
        ("/account-management/delivery-associates", "09_delivery_associates"),
        ("/fleet-management/#dashboard", "10_fleet_dashboard"),
        ("/fleet-management/?navMenuVariant=external#vehicles", "11_fleet_vehicles"),
    ]

    for path, name in pages_to_scrape:
        url = f"{BASE_URL}{path}"
        log(f"\n=== {name}: {path} ===")
        try:
            await page.get(url)
            await asyncio.sleep(6)  # Wait for SPA + XHR

            content = await page.get_content()
            if len(content) > 3000:
                save(content, name, "html")
                await page.save_screenshot(str(DATA_DIR / f"{name}.png"))

                # Scroll down to trigger lazy loading
                await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await asyncio.sleep(2)

                content_after = await page.get_content()
                if len(content_after) > len(content) + 500:
                    save(content_after, f"{name}_scrolled", "html")

        except Exception as e:
            log(f"  Error: {e}")

    # ==========================================
    # Weekly scorecard pages — try last 12 weeks
    # ==========================================
    log("\n=== Weekly Scorecard Data ===")
    current_week = datetime.now().isocalendar()[1]
    current_year = datetime.now().year

    for offset in range(0, 12):
        week = current_week - offset
        year = current_year
        if week <= 0:
            week += 52
            year -= 1

        url = f"{BASE_URL}/performance/scorecard?week={week}&year={year}"
        log(f"  W{week}/{year}...")
        try:
            await page.get(url)
            await asyncio.sleep(4)
            content = await page.get_content()
            if len(content) > 5000:
                save(content, f"scorecard_w{week}_{year}", "html")
        except:
            pass

    # ==========================================
    # Try to find and click on DWC report link
    # ==========================================
    log("\n=== Navigating to DWC Report ===")
    try:
        await page.get(f"{BASE_URL}/performance?pageId=dsp_quality&navMenuVariant=external")
        await asyncio.sleep(5)

        # Look for week selectors
        content = await page.get_content()
        save(content, "12_dwc_quality_page", "html")

        # Try clicking on DWC-related elements
        dwc_links = await page.query_selector_all("a[href*='dwc'], a[href*='quality'], [data-testid*='dwc']")
        log(f"  DWC links found: {len(dwc_links)}")

        for link in dwc_links[:3]:
            try:
                await link.click()
                await asyncio.sleep(4)
                content = await page.get_content()
                save(content, f"12_dwc_clicked", "html")
                await page.save_screenshot(str(DATA_DIR / "12_dwc_clicked.png"))
            except:
                pass

    except Exception as e:
        log(f"  Error: {e}")

    # ==========================================
    # Extract JS state data
    # ==========================================
    log("\n=== Extracting JS State ===")
    js_queries = [
        ("window.__NEXT_DATA__", "js_next_data"),
        ("window.__INITIAL_STATE__", "js_initial_state"),
        ("window.__APP_STATE__", "js_app_state"),
        ("window.__STORE__", "js_store"),
        ("document.querySelectorAll('[data-react-props]').length", "js_react_count"),
    ]

    for expr, name in js_queries:
        try:
            result = await page.evaluate(f"JSON.stringify({expr})")
            if result and result != "null" and len(str(result)) > 10:
                try:
                    data = json.loads(result)
                    save(data, name)
                except:
                    save({"raw": str(result)[:5000]}, name)
                log(f"  {name}: {len(str(result)):,} chars")
        except:
            pass

    # Extract performance entries (all XHR URLs the browser loaded)
    try:
        perf_entries = await page.evaluate("""
            JSON.stringify(
                performance.getEntries()
                    .filter(e => e.initiatorType === 'xmlhttprequest' || e.initiatorType === 'fetch')
                    .map(e => ({ url: e.name, duration: Math.round(e.duration), size: e.transferSize }))
            )
        """)
        if perf_entries:
            data = json.loads(perf_entries)
            save(data, "js_performance_xhr")
            log(f"  XHR entries: {len(data)}")
    except:
        pass

    # ==========================================
    # Export fresh cookies
    # ==========================================
    log("\n=== Exporting Fresh Cookies ===")
    try:
        result = await page.send(uc.cdp.network.get_all_cookies())
        amazon_cookies = [
            {"domain": c.domain, "name": c.name, "value": c.value,
             "path": c.path, "secure": c.secure, "httpOnly": c.http_only}
            for c in result.cookies if "amazon" in c.domain
        ]
        save(amazon_cookies, "fresh_cookies")
        with open(COOKIES_FILE, 'w') as f:
            json.dump(amazon_cookies, f, indent=2)
        log(f"  {len(amazon_cookies)} cookies exported")
    except Exception as e:
        log(f"  Error: {e}")

    # ==========================================
    # Save all captured data
    # ==========================================
    log("\n=== Saving Captured Data ===")
    save(all_responses, "all_network_responses")
    save(captured_bodies, "captured_xhr_bodies")

    # ==========================================
    # Summary
    # ==========================================
    log("\n" + "=" * 60)
    log("SCRAPING COMPLETE")
    log(f"  Network responses: {len(all_responses)}")
    log(f"  XHR bodies captured: {len(captured_bodies)}")

    files = sorted(DATA_DIR.glob("*"))
    total_size = sum(f.stat().st_size for f in files)
    log(f"  Files: {len(files)} ({total_size:,} bytes)")
    for f in files:
        log(f"    {f.name} ({f.stat().st_size:,} bytes)")
    log("=" * 60)

    browser.stop()


if __name__ == "__main__":
    asyncio.run(main())
