#!/usr/bin/env python3
"""
Amazon Logistics DEEP Scraper v3 — DSPilot
Scrapes ALL data: every week, every page, every driver.
Navigates the SPA, clicks through date pickers and pagination.
"""

import asyncio
import json
import os
import re
from datetime import datetime
from pathlib import Path

import nodriver as uc


def env_flag(name, default):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


def env_int(name, default):
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


DATA_DIR = Path(os.getenv("AMAZON_LOGISTICS_DATA_DIR", Path(__file__).parent / "data" / "deep"))
COOKIES_FILE = Path(os.getenv("AMAZON_LOGISTICS_COOKIES_FILE", "/root/.secrets/amazon-logistics-cookies.json"))
PROFILE_DIR = Path(os.getenv("AMAZON_LOGISTICS_PROFILE_DIR", Path(__file__).parent / "data" / "browser-profile"))
BASE_URL = os.getenv("AMAZON_LOGISTICS_BASE_URL", "https://logistics.amazon.fr").rstrip("/")
AMAZON_EMAIL = os.getenv("AMAZON_LOGISTICS_EMAIL")
AMAZON_PASSWORD = os.getenv("AMAZON_LOGISTICS_PASSWORD")
HEADLESS = env_flag("AMAZON_LOGISTICS_HEADLESS", True)
BROWSER_SANDBOX = env_flag("AMAZON_LOGISTICS_SANDBOX", not (hasattr(os, "geteuid") and os.geteuid() == 0))
COOKIE_EXPORT_ENABLED = env_flag("AMAZON_LOGISTICS_ENABLE_COOKIE_EXPORT", False)
WEEKS_TO_SCRAPE = env_int("AMAZON_LOGISTICS_WEEKS_TO_SCRAPE", 20)
ITINERARY_DAYS = env_int("AMAZON_LOGISTICS_ITINERARY_DAYS", 7)
BROWSER_EXECUTABLE_PATH = os.getenv("AMAZON_LOGISTICS_BROWSER_EXECUTABLE")

all_xhr = []


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def looks_like_login_page(content):
    lowered = (content or "").lower()
    login_markers = [
        "connexion amazon",
        "authportal",
        "signinsubmit",
        "ap_email",
        "ap_password",
    ]
    return any(marker in lowered for marker in login_markers)


async def find_first(page, selectors, timeout=5):
    for selector in selectors:
        element = None
        try:
            element = await page.select(selector, timeout=timeout)
        except Exception:
            element = None
        if not element:
            try:
                element = await page.find(selector, timeout=timeout)
            except Exception:
                element = None
        if element:
            return element
    return None


async def set_input_value(page, selectors, value):
    for selector in selectors:
        element = None
        try:
            element = await page.select(selector, timeout=3)
        except Exception:
            element = None
        if not element:
            continue

        try:
            await element.focus()
        except Exception:
            pass

        result = False
        try:
            await element.apply(
                """
                (input) => {
                  input.focus();
                  input.removeAttribute('readonly');
                  input.removeAttribute('disabled');
                  input.value = '';
                }
                """
            )
            await asyncio.sleep(0.2)
            await element.send_keys("\ue009" + "a")
            await asyncio.sleep(0.1)
            await element.send_keys("\ue003")
            await asyncio.sleep(0.1)
            for char in value:
                await element.send_keys(char)
                await asyncio.sleep(0.03)
            await asyncio.sleep(0.3)
            result = await element.apply(
                f"""
                (input) => {{
                  input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                  input.dispatchEvent(new Event('change', {{ bubbles: true }}));
                  return input.value === {json.dumps(value)};
                }}
                """
            )
        except Exception:
            result = False

        if not result:
            try:
                result = await element.apply(
                    f"""
                    (input) => {{
                      input.focus();
                      input.removeAttribute('readonly');
                      input.removeAttribute('disabled');
                      input.value = {json.dumps(value)};
                      input.dispatchEvent(new Event('input', {{ bubbles: true }}));
                      input.dispatchEvent(new Event('change', {{ bubbles: true }}));
                      return input.value === {json.dumps(value)};
                    }}
                    """
                )
            except Exception:
                result = False

        if result:
            return True
    return False


async def get_input_value(page, selectors):
    for selector in selectors:
        try:
            element = await page.select(selector, timeout=2)
        except Exception:
            element = None
        if not element:
            continue
        try:
            value = await element.apply("(input) => input.value")
        except Exception:
            value = None
        if value is not None:
            return value
    return None


async def click_first(page, selectors, timeout=5):
    for selector in selectors:
        try:
            element = await page.select(selector, timeout=timeout)
        except Exception:
            element = None
        if not element:
            continue
        try:
            await element.click()
            return True
        except Exception:
            try:
                await element.mouse_click()
                return True
            except Exception:
                try:
                    clicked = await element.apply(
                        "(el) => { el.click(); return true; }",
                    )
                except Exception:
                    clicked = False
                if clicked:
                    return True
    return False


async def save_login_debug(page, prefix):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        html = await page.get_content()
        (DATA_DIR / f"{prefix}.html").write_text(html, encoding="utf-8")
    except Exception as exc:
        log(f"Failed to save {prefix}.html: {exc}")
    try:
        await page.save_screenshot(str(DATA_DIR / f"{prefix}.png"))
    except Exception as exc:
        log(f"Failed to save {prefix}.png: {exc}")


def save(data, name, ext="json"):
    path = DATA_DIR / f"{name}.{ext}"
    if ext == "json":
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False, default=str), encoding='utf-8')
    else:
        path.write_text(str(data), encoding='utf-8')
    size = path.stat().st_size
    log(f"  -> {path.name} ({size:,} bytes)")
    return size


async def setup_browser():
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    browser = await uc.start(
        headless=HEADLESS,
        user_data_dir=str(PROFILE_DIR),
        browser_executable_path=BROWSER_EXECUTABLE_PATH or None,
        sandbox=BROWSER_SANDBOX,
        browser_args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu",
                       "--window-size=1920,1080", "--lang=fr-FR"],
    )
    return browser


async def close_browser(browser):
    process = getattr(browser, "_process", None)

    def is_running(proc):
        poll = getattr(proc, "poll", None)
        if callable(poll):
            return poll() is None
        return getattr(proc, "returncode", None) is None

    try:
        browser.stop()
    except Exception as exc:
        log(f"Browser stop raised: {exc}")

    if not process:
        return

    deadline = asyncio.get_running_loop().time() + 10
    while is_running(process) and asyncio.get_running_loop().time() < deadline:
        await asyncio.sleep(0.25)

    if is_running(process):
        try:
            process.terminate()
        except Exception:
            pass
        await asyncio.sleep(1)

    if is_running(process):
        try:
            process.kill()
        except Exception:
            pass
        await asyncio.sleep(1)


async def save_current_cookies(page):
    if not COOKIE_EXPORT_ENABLED:
        log("Cookie export disabled; relying on persistent browser profile")
        return []

    try:
        result = await asyncio.wait_for(page.send(uc.cdp.network.get_all_cookies()), timeout=10)
        amazon_cookies = [
            {
                "domain": c.domain,
                "name": c.name,
                "value": c.value,
                "path": c.path,
                "secure": c.secure,
                "httpOnly": c.http_only,
            }
            for c in result.cookies
            if "amazon" in c.domain
        ]
        COOKIES_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(COOKIES_FILE, "w") as f:
            json.dump(amazon_cookies, f, indent=2)
        log(f"Fresh cookies saved ({len(amazon_cookies)})")
        return amazon_cookies
    except asyncio.TimeoutError:
        log("Cookie export timed out")
        return []
    except Exception as e:
        log(f"Cookie export failed: {e}")
        return []


async def load_cookies_and_login(browser):
    page = browser.main_tab

    cookies = []
    if COOKIES_FILE.exists():
        with open(COOKIES_FILE) as f:
            cookies = json.load(f)
    else:
        log(f"No cookie jar found at {COOKIES_FILE}")

    await page.get("https://www.amazon.fr")
    await asyncio.sleep(2)

    for c in cookies:
        try:
            same_site = None
            raw_same_site = c.get("sameSite")
            if raw_same_site:
                normalized_same_site = str(raw_same_site).strip().lower()
                same_site_map = {
                    "strict": uc.cdp.network.CookieSameSite.STRICT,
                    "lax": uc.cdp.network.CookieSameSite.LAX,
                    "none": uc.cdp.network.CookieSameSite.NONE,
                    "no_restriction": uc.cdp.network.CookieSameSite.NONE,
                }
                same_site = same_site_map.get(normalized_same_site)

            expires = c.get("expirationDate")
            if expires is not None:
                try:
                    expires = uc.cdp.network.TimeSinceEpoch(float(expires))
                except (TypeError, ValueError):
                    expires = None

            source_scheme = uc.cdp.network.CookieSourceScheme.SECURE if c.get("secure", True) else uc.cdp.network.CookieSourceScheme.NON_SECURE
            domain = c["domain"].lstrip(".")
            cookie_url = f"https://{domain}{c.get('path', '/')}"

            await page.send(uc.cdp.network.set_cookie(
                name=c["name"], value=c["value"], url=cookie_url, domain=c["domain"],
                path=c.get("path", "/"), secure=c.get("secure", True),
                http_only=c.get("httpOnly", False),
                same_site=same_site,
                expires=expires,
                source_scheme=source_scheme,
            ))
        except Exception:
            pass

    if cookies:
        log(f"Cookies loaded ({len(cookies)})")

    # Test access
    await page.get(f"{BASE_URL}/dspconsole")
    await asyncio.sleep(5)
    content = await page.get_content()

    if not looks_like_login_page(content):
        log("LOGGED IN - session valid")
        await save_current_cookies(page)
        return page
    else:
        log("Session invalid - trying login...")
        if not AMAZON_EMAIL or not AMAZON_PASSWORD:
            log("Missing AMAZON_LOGISTICS_EMAIL / AMAZON_LOGISTICS_PASSWORD")
            await save_login_debug(page, "login_fail")
            return None

        try:
            email_selectors = ["#ap_email", "input[name='email']", "input[name='ap_email']"]
            email_set = await set_input_value(page, email_selectors, AMAZON_EMAIL)
            email_value = await get_input_value(page, email_selectors)
            log(f"Login email field set={email_set} value_present={bool(email_value)}")

            if email_set:
                await asyncio.sleep(1)
                continue_clicked = await click_first(page, ["#continue"], timeout=3)
                log(f"Continue clicked={continue_clicked}")
                if continue_clicked:
                    await asyncio.sleep(3)

                password_selectors = ["#ap_password", "input[name='password']", "input[name='ap_password']"]
                password_set = await set_input_value(page, password_selectors, AMAZON_PASSWORD)
                password_value = await get_input_value(page, password_selectors)
                log(f"Login password field set={password_set} value_length={len(password_value or '')}")
                if password_set:
                    await asyncio.sleep(1)
                    await save_login_debug(page, "login_before_submit")
                    signin_clicked = await click_first(page, ["#signInSubmit"], timeout=3)
                    if not signin_clicked:
                        signin_clicked = bool(
                            await page.evaluate(
                                """
                                (() => {
                                  const button = document.querySelector('#signInSubmit');
                                  if (!button) return false;
                                  button.click();
                                  return true;
                                })()
                                """,
                                return_by_value=True,
                            )
                        )
                    log(f"Sign-in clicked={signin_clicked}")
                    if not signin_clicked:
                        await page.evaluate(
                            """
                            (() => {
                              const form = document.querySelector('form');
                              if (form) form.submit();
                            })()
                            """
                        )
                    await asyncio.sleep(8)
        except Exception as e:
            log(f"Login error: {e}")

        await page.get(f"{BASE_URL}/dspconsole")
        await asyncio.sleep(5)
        content = await page.get_content()
        if not looks_like_login_page(content):
            log("Login successful")
            await save_current_cookies(page)
            return page
        else:
            log("LOGIN FAILED")
            await save_login_debug(page, "login_fail")
            return None


def read_saved_html(name):
    path = DATA_DIR / f"{name}.html"
    if not path.exists():
        return None
    return path.read_text(encoding="utf-8")


def extract_provider_context(*contents):
    provider_id = None
    service_area = None

    for content in contents:
        if not content:
            continue

        provider_match = re.search(r'providerId=(amzn1\.flex\.provider\.[^&"\'<]+)', content)
        if provider_match and not provider_id:
            provider_id = provider_match.group(1)

        service_match = re.search(r'serviceAreaId=([a-f0-9-]+)', content)
        if service_match and not service_area:
            service_area = service_match.group(1)

        if provider_id and service_area:
            break

    return provider_id, service_area


async def enable_xhr_capture(page):
    """Capture ALL XHR responses with bodies."""
    await page.send(uc.cdp.network.enable())

    async def handler(event):
        url = str(event.response.url)
        mime = event.response.mime_type or ""

        skip = ['.png', '.jpg', '.gif', '.svg', '.woff', '.css', '.ico',
                'rum.us-east', 'cloudfront', 'media-amazon']
        if any(s in url.lower() for s in skip):
            return

        entry = {"url": url, "status": event.response.status, "mime": mime,
                 "ts": datetime.now().isoformat()}

        # Capture body for JSON/API responses
        if 'json' in mime or 'javascript' not in mime:
            try:
                body = await page.send(uc.cdp.network.get_response_body(event.request_id))
                if body and body.body and len(body.body) > 50:
                    entry["body"] = body.body[:100000]
                    try:
                        entry["json"] = json.loads(body.body)
                    except:
                        pass
            except:
                pass

        all_xhr.append(entry)

    page.add_handler(uc.cdp.network.ResponseReceived, handler)


async def scrape_page_fully(page, url, name, wait=6):
    """Navigate to a URL, wait for SPA load, scroll, get ALL content."""
    log(f"  Scraping: {name}")
    await page.get(url)
    await asyncio.sleep(wait)

    # Scroll to bottom to trigger lazy loading
    for _ in range(3):
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(1)

    content = await page.get_content()
    save(content, name, "html")
    await page.save_screenshot(str(DATA_DIR / f"{name}.png"))
    return content


async def get_all_pages(page, name_prefix):
    """Click through all pagination pages and collect content."""
    all_content = []
    page_num = 1

    while True:
        content = await page.get_content()
        all_content.append({"page": page_num, "html": content})
        save(content, f"{name_prefix}_p{page_num}", "html")

        # Try to find and click "next page"
        try:
            next_btn = await page.find("[aria-label*='next page']", timeout=3)
            if next_btn:
                await next_btn.click()
                await asyncio.sleep(4)
                page_num += 1
                log(f"    Page {page_num}...")

                # Check if content changed
                new_content = await page.get_content()
                if new_content == content:
                    break
            else:
                break
        except:
            break

    log(f"    Total pages: {page_num}")
    return all_content


async def change_week(page, week_num, year=2026):
    """Change the week picker to a specific week."""
    try:
        # Find and click the week picker
        picker = await page.find("[data-testid='week-picker']", timeout=3)
        if not picker:
            picker = await page.find("[data-testid='date-picker']", timeout=3)

        if picker:
            await picker.click()
            await asyncio.sleep(2)

            # Try clicking previous week arrows
            # The picker usually has left/right arrows
            target_text = f"Semaine {week_num}"
            current_content = await page.get_content()

            # Check current week
            current_week_match = re.search(r'Semaine\s+(\d+)', current_content)
            if current_week_match:
                current_week = int(current_week_match.group(1))
                clicks_needed = current_week - week_num

                if clicks_needed > 0:
                    # Need to go back
                    for _ in range(clicks_needed):
                        try:
                            prev_btn = await page.find("[aria-label*='previous'], [aria-label*='précédent'], button[class*='prev'], [class*='left-arrow']", timeout=2)
                            if prev_btn:
                                await prev_btn.click()
                                await asyncio.sleep(1.5)
                            else:
                                break
                        except:
                            break

                    await asyncio.sleep(2)
                    return True

        # Alternative: try URL parameter approach
        return False

    except Exception as e:
        return False


async def main():
    log("=" * 70)
    log("Amazon Logistics DEEP Scraper v3 — DSPilot")
    log("GOAL: Extract ALL data, ALL weeks, ALL drivers")
    log("=" * 70)

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    browser = await setup_browser()
    page = await load_cookies_and_login(browser)
    if not page:
        await close_browser(browser)
        return

    await enable_xhr_capture(page)

    total_bytes = 0

    # =====================================================
    # PHASE 1: Main Dashboard
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 1: Main Dashboard")
    content = await scrape_page_fully(page, f"{BASE_URL}/dspconsole", "dashboard")

    # =====================================================
    # PHASE 2: Quality/DWC for ALL weeks with pagination
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 2: Quality/DWC — ALL weeks, ALL pages")

    # First, go to the quality page to see current week
    quality_url = f"{BASE_URL}/performance?pageId=dsp_quality&navMenuVariant=external"
    await page.get(quality_url)
    await asyncio.sleep(6)

    # Get current week from page
    content = await page.get_content()
    week_match = re.search(r'Semaine\s+(\d+)', content)
    current_week = int(week_match.group(1)) if week_match else 13

    log(f"  Current week: {current_week}")

    # Scrape current week first, then click previous sequentially (O(n) not O(n²))
    for week_offset in range(0, WEEKS_TO_SCRAPE):
        week = current_week - week_offset
        year = 2026
        if week <= 0:
            week += 52
            year = 2025

        log(f"\n  --- Quality W{week}/{year} ---")

        if week_offset > 0:
            # Click previous once (we're already on the previous page)
            try:
                prev = await page.find("[aria-label*='previous'], [aria-label*='précédent'], button[class*='prev']", timeout=3)
                if prev:
                    await prev.click()
                    await asyncio.sleep(3)
                else:
                    log(f"    No prev button found, stopping at W{week+1}")
                    break
            except:
                log(f"    Prev click failed, stopping")
                break

        # Scroll to load all content
        for _ in range(3):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)

        content = await page.get_content()
        if len(content) > 5000:
            save(content, f"quality_w{week}_{year}", "html")

            if "next page" in content.lower() or "page 2" in content.lower():
                pages = await get_all_pages(page, f"quality_w{week}_{year}")
                log(f"    Got {len(pages)} pages for W{week}")

    # =====================================================
    # PHASE 3: Associate Overview — ALL weeks, ALL pages
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 3: Associate Overview — ALL weeks, ALL pages")

    assoc_url = f"{BASE_URL}/performance/associate-overview"
    await page.get(assoc_url)
    await asyncio.sleep(6)

    for week_offset in range(0, WEEKS_TO_SCRAPE):
        week = current_week - week_offset
        year = 2026
        if week <= 0:
            week += 52
            year = 2025

        log(f"\n  --- Associate W{week}/{year} ---")

        if week_offset > 0:
            try:
                prev = await page.find("[aria-label*='previous'], [aria-label*='précédent'], button[class*='prev']", timeout=3)
                if prev:
                    await prev.click()
                    await asyncio.sleep(3)
                else:
                    log(f"    No prev button, stopping")
                    break
            except:
                break

        for _ in range(3):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)

        content = await page.get_content()
        if len(content) > 5000:
            save(content, f"associate_w{week}_{year}", "html")

            if "next page" in content.lower():
                await get_all_pages(page, f"associate_w{week}_{year}")

    # =====================================================
    # PHASE 4: Delivery Overview — ALL weeks
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 4: Delivery Overview — ALL weeks")

    delivery_url = f"{BASE_URL}/performance/delivery-overview"
    await page.get(delivery_url)
    await asyncio.sleep(6)

    for week_offset in range(0, WEEKS_TO_SCRAPE):
        week = current_week - week_offset
        year = 2026
        if week <= 0:
            week += 52
            year = 2025

        log(f"  Delivery W{week}/{year}")

        if week_offset > 0:
            try:
                prev = await page.find("[aria-label*='previous'], [aria-label*='précédent'], button[class*='prev']", timeout=3)
                if prev:
                    await prev.click()
                    await asyncio.sleep(3)
                else:
                    log(f"    No prev button, stopping")
                    break
            except:
                break

        for _ in range(3):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)

        content = await page.get_content()
        if len(content) > 5000:
            save(content, f"delivery_w{week}_{year}", "html")

            if "next page" in content.lower():
                await get_all_pages(page, f"delivery_w{week}_{year}")

    # =====================================================
    # PHASE 5: Station Metrics — ALL dates
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 5: Station Metrics")

    station_url = f"{BASE_URL}/performance/station-metrics"
    await page.get(station_url)
    await asyncio.sleep(5)

    content = await page.get_content()
    save(content, "station_metrics_current", "html")

    # Navigate back in time
    for offset in range(1, 15):
        try:
            prev = await page.find("[aria-label*='previous'], [aria-label*='précédent']", timeout=2)
            if prev:
                await prev.click()
                await asyncio.sleep(3)
                content = await page.get_content()
                if len(content) > 5000:
                    save(content, f"station_metrics_offset_{offset}", "html")
        except:
            break

    # =====================================================
    # PHASE 6: Fleet Management (vehicles, drivers list)
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 6: Fleet & Delivery Associates")

    fleet_pages = [
        (f"{BASE_URL}/fleet-management/#dashboard", "fleet_dashboard"),
        (f"{BASE_URL}/fleet-management/?navMenuVariant=external#vehicles", "fleet_vehicles"),
        (f"{BASE_URL}/account-management/delivery-associates", "all_associates"),
    ]

    for url, name in fleet_pages:
        content = await scrape_page_fully(page, url, name, wait=6)
        # Get all pagination pages
        if "next page" in content.lower() or "page 2" in content.lower():
            await get_all_pages(page, name)

    # =====================================================
    # PHASE 7: Supplementary Reports
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 7: Supplementary Reports")

    reports_url = f"{BASE_URL}/performance?pageId=dsp_supp_reports&navMenuVariant=external"
    content = await scrape_page_fully(page, reports_url, "supplementary_reports")

    # =====================================================
    # PHASE 8: Safety Dashboard
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 8: Safety Dashboard")

    safety_url = f"{BASE_URL}/performance?pageId=dsp_safety&navMenuVariant=external"
    content = await scrape_page_fully(page, safety_url, "safety_current")

    for offset in range(1, 10):
        try:
            await page.get(safety_url)
            await asyncio.sleep(4)
            for _ in range(offset):
                prev = await page.find("[aria-label*='previous'], [aria-label*='précédent']", timeout=2)
                if prev:
                    await prev.click()
                    await asyncio.sleep(2)
            await asyncio.sleep(2)
            content = await page.get_content()
            if len(content) > 5000:
                save(content, f"safety_offset_{offset}", "html")
        except:
            break

    # =====================================================
    # PHASE 9: Operations / Harmony (itineraries)
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 9: Operations")

    provider_id, service_area = extract_provider_context(
        content,
        read_saved_html("dashboard"),
        read_saved_html("station_metrics_current"),
    )

    if provider_id and service_area:
        log(f"  Provider: {provider_id}")
        log(f"  Service Area: {service_area}")

        # Get itineraries for the last 7 days
        from datetime import timedelta
        today = datetime.now()
        provider_filter = provider_id.split(".")[-1]
        for day_offset in range(0, ITINERARY_DAYS):
            date = (today - timedelta(days=day_offset)).strftime("%Y-%m-%d")
            ops_url = (
                f"{BASE_URL}/operations/execution/itineraries?"
                f"operationView=true&providerFilter={provider_filter}"
                f"&selectedDay={date}&serviceAreaId={service_area}"
            )
            log(f"  Itineraries {date}")
            try:
                await page.get(ops_url)
                await asyncio.sleep(5)
                content = await page.get_content()
                if len(content) > 5000:
                    save(content, f"itineraries_{date}", "html")
            except:
                pass
    else:
        log("  Missing provider/service area context, skipping itineraries")

    # =====================================================
    # PHASE 10: Export fresh cookies + all XHR data
    # =====================================================
    log(f"\n{'='*50}")
    log("PHASE 10: Export & Summary")

    # Fresh cookies
    try:
        amazon_cookies = await save_current_cookies(page)
        log(f"  Fresh cookies: {len(amazon_cookies)}")
    except:
        pass

    # Save all XHR
    save(all_xhr, "all_xhr_responses")

    # Filter interesting XHR with JSON bodies
    json_xhrs = [x for x in all_xhr if x.get("json")]
    if json_xhrs:
        save(json_xhrs, "xhr_json_data")
        log(f"  XHR with JSON: {len(json_xhrs)}")

    # =====================================================
    # SUMMARY
    # =====================================================
    log(f"\n{'='*70}")
    log("DEEP SCRAPING COMPLETE")
    files = sorted(DATA_DIR.glob("*"))
    total = sum(f.stat().st_size for f in files)
    html_files = [f for f in files if f.suffix == '.html']
    json_files = [f for f in files if f.suffix == '.json']
    png_files = [f for f in files if f.suffix == '.png']

    log(f"  Total files: {len(files)}")
    log(f"  HTML pages: {len(html_files)}")
    log(f"  JSON data: {len(json_files)}")
    log(f"  Screenshots: {len(png_files)}")
    log(f"  Total size: {total:,} bytes ({total/1024/1024:.1f} MB)")
    log(f"  XHR captured: {len(all_xhr)}")
    log(f"  XHR with JSON: {len(json_xhrs)}")

    log(f"\nFiles:")
    for f in files:
        log(f"  {f.name} ({f.stat().st_size:,})")

    log("=" * 70)

    await close_browser(browser)


if __name__ == "__main__":
    asyncio.run(main())
