#!/usr/bin/env python3
"""
Parse ALL scraped HTML from Amazon Logistics into structured JSON.
Extracts: quality scores, associate stats, driver roster, fleet, itineraries.
"""

import json
import re
from pathlib import Path
from bs4 import BeautifulSoup
from collections import defaultdict

DATA_DIR = Path(__file__).parent / "data" / "deep"
OUTPUT_DIR = Path(__file__).parent / "data" / "parsed"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def normalize_text(text):
    return re.sub(r'\s+', ' ', (text or '').replace('\xa0', ' ')).strip()


def clean_number(text):
    """Parse French-formatted numbers: '2,816' -> 2816, '0.56%' -> 0.56"""
    if not text or text == "Aucune donnée" or text == "- -":
        return None
    text = text.strip().replace('\xa0', '').replace(' ', '')
    # Remove trailing %
    text = text.rstrip('%')
    # Handle French thousands separator
    if ',' in text and '.' not in text and len(text.split(',')[-1]) == 3:
        text = text.replace(',', '')  # thousands separator
    elif ',' in text:
        text = text.replace(',', '.')  # decimal separator
    try:
        if '.' in text:
            return float(text)
        return int(text)
    except ValueError:
        return text


def parse_quality_page(filepath):
    """Parse a quality/DWC page — columns: Livreur, Colis livrés, Itinéraires, DCR, SWC-POD, DNR"""
    html = filepath.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    table = soup.find('table')
    if not table:
        return []

    rows = table.find_all('tr')
    if len(rows) < 2:
        return []

    drivers = []
    for row in rows[1:]:  # Skip header
        # Name is in <th> with data-testid=da_name, rest in <td>
        name_cell = row.find('th', attrs={'data-testid': 'da_name'})
        if not name_cell:
            name_cell = row.find('th')
        cells = row.find_all('td')
        if not name_cell or len(cells) < 5:
            continue

        driver_name = name_cell.get_text(strip=True)
        raw_texts = [c.get_text(strip=True) for c in cells]

        # Parse DCR: "100.00%3.0" -> percentage + delta
        dcr_text = raw_texts[2]  # index shifted since name is in th
        dcr_match = re.match(r'([\d.]+)%(.+)', dcr_text)
        dcr_pct = float(dcr_match.group(1)) if dcr_match else None

        # Parse SWC-POD: "100.00%- -0.0" or "93.02%7.0"
        pod_text = raw_texts[3]
        pod_match = re.match(r'([\d.]+)%(.+)', pod_text)
        pod_pct = float(pod_match.group(1)) if pod_match else None

        # Parse DNR: "0- -0" or "1- -0"
        dnr_text = raw_texts[4]
        dnr_match = re.match(r'(\d+)', dnr_text)
        dnr_count = int(dnr_match.group(1)) if dnr_match else 0

        drivers.append({
            "name": driver_name,
            "packages_delivered": clean_number(raw_texts[0]),
            "routes_completed": clean_number(raw_texts[1]),
            "dcr_pct": dcr_pct,
            "swc_pod_pct": pod_pct,
            "dnr_count": dnr_count,
        })

    return drivers


def parse_associate_page(filepath):
    """Parse associate overview — columns vary but include: Name, Colis, DNR, DPMO, RTS, etc."""
    html = filepath.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    table = soup.find('table')
    if not table:
        return []

    rows = table.find_all('tr')
    if len(rows) < 2:
        return []

    # Get headers
    headers = [c.get_text(strip=True) for c in rows[0].find_all(['th', 'td'])]

    drivers = []
    for row in rows[1:]:
        # Name is in <th> with data-testid=da_name
        name_cell = row.find('th', attrs={'data-testid': 'da_name'})
        if not name_cell:
            name_cell = row.find('th')
        cells = row.find_all('td')
        if not name_cell or len(cells) < 4:
            continue

        raw = [c.get_text(strip=True) for c in cells]

        # Name has Amazon ID appended — extract clean name
        name_raw = name_cell.get_text(strip=True)
        name_match = re.match(r'^([A-Za-zÀ-ÿ\s\'-]+?)([A-Z0-9]{10,})', name_raw)
        name = name_match.group(1).strip() if name_match else name_raw
        amazon_id = name_match.group(2) if name_match else None

        entry = {
            "name": name,
            "amazon_id": amazon_id,
            "packages_delivered": clean_number(raw[0]) if len(raw) > 0 else None,
            "dnr_count": clean_number(raw[1]) if len(raw) > 1 else None,
            "dnr_dpmo": clean_number(raw[2]) if len(raw) > 2 else None,
            "packages_shipped": clean_number(raw[3]) if len(raw) > 3 else None,
            "rts_count": clean_number(raw[4]) if len(raw) > 4 else None,
            "rts_pct": clean_number(raw[5]) if len(raw) > 5 else None,
            "rts_dpmo": clean_number(raw[6]) if len(raw) > 6 else None,
        }
        drivers.append(entry)

    return drivers


def parse_all_associates(filepath):
    """Parse delivery associates list — Name, Provider ID, DSP name, Email, Phone, Status, Service Area"""
    html = filepath.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    table = soup.find('table')
    if not table:
        return []

    rows = table.find_all('tr')
    associates = []

    for row in rows[1:]:
        cells = row.find_all('td')
        if len(cells) < 7:
            continue

        raw = [c.get_text(strip=True) for c in cells]
        associates.append({
            "name": raw[0],
            "provider_id": raw[1],
            "dsp_name": raw[2],
            "email": raw[3],
            "phone": raw[4],
            "onboarding_tasks": raw[5],
            "status": raw[6],
            "service_area": raw[7] if len(raw) > 7 else "",
        })

    return associates


def parse_fleet_vehicles(filepath):
    """Parse fleet vehicles page — multiple tables, data in th+td."""
    html = filepath.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    tables = soup.find_all('table')
    vehicles = []

    for table in tables:
        rows = table.find_all('tr')
        if len(rows) < 2:
            continue

        for row in rows[1:]:
            cells = row.find_all(['th', 'td'])
            raw = [c.get_text(strip=True) for c in cells]
            if raw and len(raw) >= 4:
                vehicles.append({
                    "vehicle": raw[0][:100],
                    "ownership_type": raw[1][:100],
                    "expiration": raw[2],
                    "operational_status": raw[3],
                })

    return vehicles


def parse_itineraries(filepath):
    """Parse itineraries page using the DOM structure of Cortex itinerary cards."""
    html = filepath.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    vlist = soup.find(attrs={'data-testid': 'virtuoso-item-list'})
    if not vlist:
        return []

    entries = []
    children = vlist.find_all('div', recursive=False)

    for child in children:
        item = child.find('div', class_=lambda value: value and 'meridian-itinerary-summary-list-item' in value)
        if not item:
            continue

        paragraphs = [normalize_text(p.get_text(' ', strip=True)) for p in item.find_all('p')]
        paragraphs = [p for p in paragraphs if p]
        if len(paragraphs) < 6:
            continue

        raw_text = ' | '.join(paragraphs)
        entry = {"raw_text": raw_text[:500]}

        classes = item.get('class', [])
        transporter_class = next((c for c in classes if c.startswith('transporter-')), None)
        if transporter_class:
            entry["amazon_id"] = transporter_class.split('transporter-', 1)[1]

        entry["name"] = paragraphs[0]

        for text in paragraphs[1:]:
            if 'arrêts/heure' in text:
                match = re.search(r'Moy\.:\s*(\d+)\s*arrêts/heure', text)
                if match:
                    entry["avg_stops_per_hour"] = int(match.group(1))
            elif 'arrêts/dernière heure' in text:
                match = re.search(r'Rythme:\s*(\d+)\s*arrêts/dernière heure', text)
                if match:
                    entry["last_hour_stops"] = int(match.group(1))
            elif 'restant pour le quart de travail' in text:
                match = re.search(r'([\dhm\s]+)\s+restant pour le quart de travail', text)
                if match:
                    entry["time_remaining"] = normalize_text(match.group(1))
            elif 'Dernier:' in text:
                match = re.search(r'Dernier:\s*Livraison à\s*([\d:]+)', text)
                if match:
                    entry["last_delivery_at"] = match.group(1)
            elif 'RTS projeté:' in text:
                match = re.search(r'RTS projeté:\s*([\d:]+)', text)
                if match:
                    entry["rts_projected"] = match.group(1)
            elif re.fullmatch(r'\+33[\d\s]+', text):
                entry["phone"] = text
            elif 'arrêts' in text and '/' in text:
                match = re.search(r'(\d+)\s*/\s*(\d+)\s*arrêts', text)
                if match:
                    entry["stops_done"] = int(match.group(1))
                    entry["stops_total"] = int(match.group(2))
            elif 'livraisons' in text and '/' in text:
                match = re.search(r'(\d+)\s*/\s*(\d+)\s*livraisons', text)
                if match:
                    entry["deliveries_done"] = int(match.group(1))
                    entry["deliveries_total"] = int(match.group(2))
            elif text.endswith('%') and text[:-1].isdigit():
                entry["completion_pct"] = int(text[:-1])
            elif not entry.get("route_code"):
                entry["route_code"] = text

        entries.append(entry)

    return entries


def extract_week_year(filename):
    """Extract week and year from filename like 'quality_w13_2026.html'"""
    match = re.search(r'w(\d+)_(\d{4})', filename)
    if match:
        return int(match.group(1)), int(match.group(2))
    return None, None


def week_sort_key(week_key):
    match = re.match(r'W(\d+)/(\d{4})', week_key)
    if match:
        return int(match.group(2)), int(match.group(1))
    return 0, 0


def find_adjacent_duplicates(weeks_dict):
    ordered = sorted(weeks_dict.keys(), key=week_sort_key)
    duplicates = []
    for previous, current in zip(ordered, ordered[1:]):
        if json.dumps(weeks_dict[previous], sort_keys=True) == json.dumps(weeks_dict[current], sort_keys=True):
            duplicates.append((previous, current))
    return duplicates


def main():
    print("=" * 60)
    print("PARSING ALL SCRAPED DATA")
    print("=" * 60)

    all_data = {
        "quality_by_week": {},
        "associates_by_week": {},
        "all_drivers_roster": [],
        "fleet_vehicles": [],
        "itineraries_by_date": {},
        "station_metrics": [],
        "safety": [],
        "summary": {},
    }

    # ========================================
    # 1. Quality/DWC pages — all weeks, all pages
    # ========================================
    print("\n--- Quality/DWC ---")
    quality_files = sorted(DATA_DIR.glob("quality_w*.html"))

    for f in quality_files:
        # Skip pagination copies (p1, p2, etc.) — merge them
        if '_p' in f.stem:
            continue

        week, year = extract_week_year(f.name)
        if not week:
            continue

        key = f"W{week}/{year}"
        all_drivers = parse_quality_page(f)

        # Also parse pagination pages
        for pf in sorted(DATA_DIR.glob(f"quality_w{week}_{year}_p*.html")):
            page_drivers = parse_quality_page(pf)
            # Deduplicate by name
            existing_names = {d["name"] for d in all_drivers}
            for d in page_drivers:
                if d["name"] not in existing_names:
                    all_drivers.append(d)
                    existing_names.add(d["name"])

        all_data["quality_by_week"][key] = all_drivers
        print(f"  {key}: {len(all_drivers)} drivers")

    # ========================================
    # 2. Associate Overview — all weeks, all pages
    # ========================================
    print("\n--- Associate Overview ---")
    assoc_files = sorted(DATA_DIR.glob("associate_w*.html"))

    for f in assoc_files:
        if '_p' in f.stem:
            continue

        week, year = extract_week_year(f.name)
        if not week:
            continue

        key = f"W{week}/{year}"
        all_drivers = parse_associate_page(f)

        for pf in sorted(DATA_DIR.glob(f"associate_w{week}_{year}_p*.html")):
            page_drivers = parse_associate_page(pf)
            existing_names = {d["name"] for d in all_drivers}
            for d in page_drivers:
                if d["name"] not in existing_names:
                    all_drivers.append(d)
                    existing_names.add(d["name"])

        all_data["associates_by_week"][key] = all_drivers
        print(f"  {key}: {len(all_drivers)} drivers")

    # ========================================
    # 3. All Drivers Roster
    # ========================================
    print("\n--- Driver Roster ---")
    roster_file = DATA_DIR / "all_associates.html"
    if roster_file.exists():
        roster = parse_all_associates(roster_file)
        all_data["all_drivers_roster"] = roster

        # Stats
        statuses = defaultdict(int)
        for d in roster:
            statuses[d.get("status", "UNKNOWN")] += 1

        print(f"  Total: {len(roster)} associates")
        for status, count in sorted(statuses.items()):
            print(f"    {status}: {count}")

    # ========================================
    # 4. Fleet Vehicles
    # ========================================
    print("\n--- Fleet Vehicles ---")
    fleet_files = sorted(DATA_DIR.glob("fleet_vehicles*.html"))
    all_vehicles = []

    for f in fleet_files:
        vehicles = parse_fleet_vehicles(f)
        existing = {json.dumps(v, sort_keys=True) for v in all_vehicles}
        for v in vehicles:
            key = json.dumps(v, sort_keys=True)
            if key not in existing:
                all_vehicles.append(v)
                existing.add(key)

    all_data["fleet_vehicles"] = all_vehicles
    print(f"  Total vehicles: {len(all_vehicles)}")

    # ========================================
    # 5. Itineraries
    # ========================================
    print("\n--- Itineraries ---")
    itin_files = sorted(DATA_DIR.glob("itineraries_*.html"))

    for f in itin_files:
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', f.name)
        if date_match:
            date = date_match.group(1)
            data = parse_itineraries(f)
            all_data["itineraries_by_date"][date] = data
            print(f"  {date}: {len(data)} entries")

    # ========================================
    # 6. Build unified driver database
    # ========================================
    print("\n--- Building Unified Driver Database ---")

    # Merge quality + associate data per driver per week
    all_driver_names = set()
    for week_data in all_data["quality_by_week"].values():
        for d in week_data:
            all_driver_names.add(d["name"])
    for week_data in all_data["associates_by_week"].values():
        for d in week_data:
            all_driver_names.add(d["name"])

    # Build per-driver history
    driver_db = {}
    for name in sorted(all_driver_names):
        driver_db[name] = {
            "name": name,
            "quality_history": [],
            "associate_history": [],
            "roster_info": None,
        }

    # Fill quality history
    for week_key, drivers in sorted(all_data["quality_by_week"].items()):
        for d in drivers:
            if d["name"] in driver_db:
                entry = {**d, "week": week_key}
                driver_db[d["name"]]["quality_history"].append(entry)

    # Fill associate history
    for week_key, drivers in sorted(all_data["associates_by_week"].items()):
        for d in drivers:
            if d["name"] in driver_db:
                entry = {**d, "week": week_key}
                driver_db[d["name"]]["associate_history"].append(entry)

    # Match roster info
    for assoc in all_data["all_drivers_roster"]:
        name = assoc["name"]
        # Try exact match first
        if name in driver_db:
            driver_db[name]["roster_info"] = assoc
        else:
            # Try fuzzy match (first + last name)
            for db_name in driver_db:
                if name.lower() in db_name.lower() or db_name.lower() in name.lower():
                    driver_db[db_name]["roster_info"] = assoc
                    break

    print(f"  Unique drivers: {len(driver_db)}")

    # Count drivers with data
    with_quality = sum(1 for d in driver_db.values() if d["quality_history"])
    with_assoc = sum(1 for d in driver_db.values() if d["associate_history"])
    with_roster = sum(1 for d in driver_db.values() if d["roster_info"])
    print(f"  With quality data: {with_quality}")
    print(f"  With associate data: {with_assoc}")
    print(f"  With roster info: {with_roster}")

    # ========================================
    # 7. Summary stats
    # ========================================
    all_data["summary"] = {
        "total_quality_weeks": len(all_data["quality_by_week"]),
        "total_associate_weeks": len(all_data["associates_by_week"]),
        "total_roster_entries": len(all_data["all_drivers_roster"]),
        "total_fleet_vehicles": len(all_data["fleet_vehicles"]),
        "total_itinerary_dates": len(all_data["itineraries_by_date"]),
        "unique_drivers": len(driver_db),
        "quality_weeks": sorted(all_data["quality_by_week"].keys(), key=week_sort_key),
        "associate_weeks": sorted(all_data["associates_by_week"].keys(), key=week_sort_key),
        "itinerary_dates": sorted(all_data["itineraries_by_date"].keys()),
        "quality_adjacent_duplicate_pairs": find_adjacent_duplicates(all_data["quality_by_week"]),
        "associate_adjacent_duplicate_pairs": find_adjacent_duplicates(all_data["associates_by_week"]),
    }

    # ========================================
    # SAVE
    # ========================================
    print("\n--- Saving ---")

    def save_json(data, name):
        path = OUTPUT_DIR / f"{name}.json"
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False, default=str), encoding='utf-8')
        print(f"  {name}.json ({path.stat().st_size:,} bytes)")

    save_json(all_data["quality_by_week"], "quality_by_week")
    save_json(all_data["associates_by_week"], "associates_by_week")
    save_json(all_data["all_drivers_roster"], "driver_roster")
    save_json(all_data["fleet_vehicles"], "fleet_vehicles")
    save_json(all_data["itineraries_by_date"], "itineraries_by_date")
    save_json(all_data["summary"], "summary")
    save_json(driver_db, "driver_database")
    save_json(all_data, "all_data_combined")

    # ========================================
    # Quick analysis
    # ========================================
    print("\n" + "=" * 60)
    print("QUICK ANALYSIS")
    print("=" * 60)

    # Latest week DCR rankings
    latest_week = max(all_data["quality_by_week"].keys(), key=week_sort_key) if all_data["quality_by_week"] else None
    if latest_week:
        drivers = all_data["quality_by_week"][latest_week]
        print(f"\n  Latest Quality ({latest_week}): {len(drivers)} drivers")

        # Sort by DCR
        with_dcr = [d for d in drivers if d["dcr_pct"] is not None]
        with_dcr.sort(key=lambda x: x["dcr_pct"], reverse=True)

        print(f"\n  TOP 5 DCR:")
        for d in with_dcr[:5]:
            print(f"    {d['name']}: DCR {d['dcr_pct']}% | POD {d['swc_pod_pct']}% | {d['packages_delivered']} colis | DNR {d['dnr_count']}")

        print(f"\n  BOTTOM 5 DCR:")
        for d in with_dcr[-5:]:
            print(f"    {d['name']}: DCR {d['dcr_pct']}% | POD {d['swc_pod_pct']}% | {d['packages_delivered']} colis | DNR {d['dnr_count']}")

    quality_duplicates = all_data["summary"]["quality_adjacent_duplicate_pairs"]
    assoc_duplicates = all_data["summary"]["associate_adjacent_duplicate_pairs"]
    if quality_duplicates or assoc_duplicates:
        print(f"\n  WARNING: Historical weeks look duplicated")
        print(f"    Quality duplicate pairs: {len(quality_duplicates)}")
        print(f"    Associate duplicate pairs: {len(assoc_duplicates)}")

        # DNR offenders
        with_dnr = [d for d in drivers if d.get("dnr_count", 0) and d["dnr_count"] > 0]
        with_dnr.sort(key=lambda x: x["dnr_count"], reverse=True)
        if with_dnr:
            print(f"\n  DNR Offenders ({latest_week}):")
            for d in with_dnr[:10]:
                print(f"    {d['name']}: {d['dnr_count']} DNR")

    # Active vs offboarded
    active = [d for d in all_data["all_drivers_roster"] if d.get("status") == "ACTIVE"]
    offboarded = [d for d in all_data["all_drivers_roster"] if d.get("status") == "OFFBOARDED"]
    print(f"\n  Roster: {len(active)} active, {len(offboarded)} offboarded")

    print("\n" + "=" * 60)
    print("DONE")
    print("=" * 60)


if __name__ == "__main__":
    main()
