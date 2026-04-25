#!/usr/bin/env python3
"""
Enrichissement des leads DSP IDF — async parallèle.

Pour chaque lead :
1. Génère plusieurs candidats domaines à partir du nom de société
2. Probe HTTPS/HTTP sur chaque candidat (HEAD/GET)
3. Si site valide trouvé : fetch / + /contact + /mentions-legales
4. Parse tel (regex FR) + email (mailto + regex) + LinkedIn URL
5. Output JSON enriched dataset.

Sources :
- Domain guess multi-variants à partir du nom (élimine accents, mots vides)
- Site web société (homepage + /contact + /mentions-legales)
- Pas de scrape Pages Jaunes (CAPTCHA DataDome confirmé)
"""

from __future__ import annotations

import asyncio
import json
import re
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any

import aiohttp
from bs4 import BeautifulSoup

# ===== Config =====

CONCURRENCY = 30  # parallèle
TIMEOUT_SEC = 8
MAX_RETRIES = 1
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Mots vides à retirer pour deviner le domaine
STOPWORDS = {
    "sas", "sarl", "sasu", "eurl", "snc", "sa", "scop", "sci",
    "transport", "transports", "logistic", "logistics", "logistique",
    "express", "ile", "de", "france", "et", "and", "le", "la", "les",
    "groupe", "compagnie", "cie", "societe", "company", "the", "du", "des",
}

# Regex tel FR (formats courants)
RE_TEL = re.compile(
    r"(?:(?:\+33|0033|0)[\s.\-]?[1-9](?:[\s.\-]?\d{2}){4})",
    re.UNICODE,
)
# Regex mailto et email-in-text
RE_MAILTO = re.compile(r'mailto:([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})', re.IGNORECASE)
RE_EMAIL = re.compile(
    r"\b[A-Za-z0-9._%+\-]+@(?:[A-Za-z0-9\-]+\.)+(?:fr|com|net|org|eu|io|co)\b",
    re.IGNORECASE,
)
# Bad emails à filtrer (placeholders, trackers)
BAD_EMAIL_PATTERNS = re.compile(
    r"(?:noreply|no-reply|example\.com|sentry\.io|wixpress|@2x|"
    r"@\.\.|wpengine|automattic|contact@)",
    re.IGNORECASE,
)
# LinkedIn company URL
RE_LINKEDIN = re.compile(
    r"https?://(?:[a-z]{2,3}\.)?linkedin\.com/(?:company|in)/[A-Za-z0-9_\-./]+",
    re.IGNORECASE,
)


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower()
    s = re.sub(r"[^a-z0-9 -]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def guess_domains(nom_complet: str) -> list[str]:
    """Génère 3-8 candidats domaines à partir du nom de société."""
    s = slugify(nom_complet)
    # Retire les sigles entre parenthèses du nom complet : "FOO (FOO BAR)" → "FOO"
    s_no_paren = re.sub(r"\(.+?\)", "", s).strip()
    if s_no_paren:
        s = s_no_paren

    all_tokens = [p for p in s.split() if len(p) >= 2]
    parts = [p for p in all_tokens if p not in STOPWORDS]

    # Fallback : si stopwords ont tout viré, garder les tokens originaux
    if not parts and all_tokens:
        parts = all_tokens

    if not parts:
        return []

    candidates: list[str] = []
    # 1. Tous les mots significatifs collés
    candidates.append("".join(parts))
    # 2. Premier mot seul si long
    if len(parts[0]) >= 4:
        candidates.append(parts[0])
    # 3. 2 premiers mots collés
    if len(parts) >= 2:
        candidates.append(parts[0] + parts[1])
    # 4. Avec tirets (3 premiers)
    if len(parts) >= 2:
        candidates.append("-".join(parts[:3]))
    # 5. Sigle des mots significatifs
    if len(parts) >= 2:
        sigle = "".join(p[0] for p in parts[:4])
        if len(sigle) >= 3:
            candidates.append(sigle)
    # 6. Sigle de TOUS les mots (FG LOGISTICS → fl ne marche pas mais fglog oui)
    if len(all_tokens) >= 2:
        sigle_all = "".join(p[0] for p in all_tokens[:4])
        if len(sigle_all) >= 2:
            candidates.append(sigle_all)
    # 7. Si on a un mot court (sigle déjà), ajouter avec "transport"
    if parts and len(parts[0]) <= 5 and "transport" in nom_complet.lower():
        candidates.append(parts[0] + "transport")
        candidates.append("transports" + parts[0])

    # Dédup + suffix .fr puis .com
    seen: set[str] = set()
    out: list[str] = []
    for c in candidates:
        if not c or len(c) < 3 or len(c) > 30:
            continue
        for tld in (".fr", ".com"):
            d = c + tld
            if d not in seen:
                seen.add(d)
                out.append(d)
    return out[:10]


async def fetch(session: aiohttp.ClientSession, url: str, timeout: int = TIMEOUT_SEC) -> tuple[int, str, str]:
    """Fetch URL. Return (status, final_url, body). Empty body si erreur."""
    try:
        async with session.get(
            url,
            timeout=aiohttp.ClientTimeout(total=timeout),
            allow_redirects=True,
            ssl=False,
        ) as resp:
            if resp.status >= 400:
                return resp.status, str(resp.url), ""
            try:
                body = await resp.text(errors="ignore")
            except Exception:
                body = ""
            return resp.status, str(resp.url), body[:200_000]  # cap 200KB
    except (asyncio.TimeoutError, aiohttp.ClientError, Exception):
        return 0, url, ""


def normalize_phone(tel: str) -> str:
    """Normalize en +33 X XX XX XX XX."""
    digits = re.sub(r"\D", "", tel)
    if digits.startswith("33") and len(digits) == 11:
        digits = "0" + digits[2:]
    elif digits.startswith("0033") and len(digits) == 13:
        digits = "0" + digits[4:]
    if len(digits) != 10 or not digits.startswith("0"):
        return ""
    if digits[1] == "0":
        return ""
    # Skip 0800/numéros surtaxés
    if digits[1] in ("8", "9") and len(digits) == 10:
        # 08 = numéros spéciaux, 09 = box internet (acceptable mais downpriorité)
        if digits[1] == "8":
            return ""
    return f"+33 {digits[1]} {digits[2:4]} {digits[4:6]} {digits[6:8]} {digits[8:10]}"


def extract_tels(html: str) -> list[str]:
    found = set()
    for m in RE_TEL.finditer(html):
        normalized = normalize_phone(m.group(0))
        if normalized:
            found.add(normalized)
    return list(found)


def extract_emails(html: str, domain_hint: str = "") -> list[str]:
    found = set()
    for m in RE_MAILTO.finditer(html):
        e = m.group(1).lower()
        if not BAD_EMAIL_PATTERNS.search(e):
            found.add(e)
    for m in RE_EMAIL.finditer(html):
        e = m.group(0).lower()
        if BAD_EMAIL_PATTERNS.search(e):
            continue
        # Prioriser emails dont le domaine matche
        if domain_hint and domain_hint in e:
            found.add(e)
        elif not domain_hint:
            found.add(e)
        else:
            # email externe → on le garde quand même mais score plus bas
            found.add(e)
    return list(found)


def extract_linkedin(html: str) -> str | None:
    m = RE_LINKEDIN.search(html)
    if m:
        return m.group(0).rstrip(".,/")
    return None


PARKING_MARKERS = (
    "domain for sale",
    "ce domaine est à vendre",
    "parked domain",
    "this domain is for sale",
    "buy this domain",
    "purchase this domain",
    "might be for sale",
    "sedoparking",
    "expired domain",
    "domain.com is for sale",
    "godaddy.com",
    "afternic",
)


async def probe_domain(session: aiohttp.ClientSession, domain: str) -> str | None:
    """Probe https://domain et http://domain. Return final URL si site valide."""
    for url in (f"https://{domain}", f"https://www.{domain}", f"http://{domain}"):
        status, final, body = await fetch(session, url, timeout=5)
        if status != 200 or len(body) < 500:
            continue
        low = body.lower()
        if any(x in low for x in PARKING_MARKERS):
            continue
        # Heuristique anti-squat : le titre/h1 doit contenir des mots transport/livraison/colis/logistic
        if not any(kw in low for kw in (
            "transport", "logistic", "livraison", "livreur", "colis",
            "fret", "messagerie", "express", "amazon", "delivery", "dsp",
            "expédition", "expedition", "bagage", "courrier",
        )):
            # Pas de mot-clé métier → probable squat/homonyme, on rejette
            continue
        return final
    return None


RE_PROCEDURE = re.compile(
    r"(Liquidation judiciaire|Redressement judiciaire|Sauvegarde|Cessation d'activit[ée]|"
    r"Procédure de conciliation|Plan de continuation)",
    re.IGNORECASE,
)


async def fetch_societe_com_procedure(
    session: aiohttp.ClientSession, siren: str
) -> str:
    """Scrape société.com pour détecter les procédures collectives. Return label ou ''."""
    url = f"https://www.societe.com/cgi-bin/search?champs={siren}"
    try:
        async with session.get(
            url,
            timeout=aiohttp.ClientTimeout(total=10),
            allow_redirects=True,
            ssl=False,
        ) as resp:
            if resp.status != 200:
                return ""
            raw = await resp.read()
            try:
                html = raw.decode("utf-8", errors="ignore")
            except Exception:
                html = raw.decode("latin-1", errors="ignore")
        m = RE_PROCEDURE.search(html)
        return m.group(1) if m else ""
    except Exception:
        return ""


async def enrich_one(session: aiohttp.ClientSession, lead: dict[str, Any]) -> dict[str, Any]:
    """Pipeline pour 1 lead. Return dict avec champs enrichis."""
    nom = lead.get("nom") or ""
    siren = lead.get("siren") or ""
    enriched = {
        "siren": siren,
        "nom": nom,
        "domain": "",
        "website": "",
        "phones": [],
        "emails": [],
        "linkedin": "",
        "procedure": "",
        "sources": [],
    }

    # Stage 1: try guessed domains
    candidates = guess_domains(nom)
    found_url = None
    for d in candidates:
        result = await probe_domain(session, d)
        if result:
            found_url = result
            enriched["domain"] = d
            enriched["website"] = result
            enriched["sources"].append(f"domain:{d}")
            break

    # Stage 2: scrape site if found
    if found_url:
        base = found_url.rstrip("/")
        scrape_urls = [
            base,
            f"{base}/contact",
            f"{base}/contact-us",
            f"{base}/contact.html",
            f"{base}/contact/",
            f"{base}/nous-contacter",
            f"{base}/mentions-legales",
            f"{base}/mentions-legales/",
            f"{base}/legal",
            f"{base}/a-propos",
            f"{base}/qui-sommes-nous",
        ]

        all_html: list[str] = []
        for url in scrape_urls:
            status, _, body = await fetch(session, url, timeout=6)
            if status == 200 and body:
                all_html.append(body)
                if len(all_html) >= 4:
                    break

        if all_html:
            combined = "\n".join(all_html)
            enriched["phones"] = extract_tels(combined)[:3]
            enriched["emails"] = extract_emails(combined, enriched["domain"])[:3]
            li = extract_linkedin(combined)
            if li:
                enriched["linkedin"] = li
            enriched["sources"].append(f"scrape:{len(all_html)}p")

    # Stage 3: société.com pour flag procédure collective
    if siren:
        proc = await fetch_societe_com_procedure(session, siren)
        if proc:
            enriched["procedure"] = proc
            enriched["sources"].append("soc.com:proc")

    return enriched


async def main_async(leads: list[dict[str, Any]]) -> list[dict[str, Any]]:
    sem = asyncio.Semaphore(CONCURRENCY)
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    }
    connector = aiohttp.TCPConnector(limit=CONCURRENCY, limit_per_host=4, ttl_dns_cache=300)

    async with aiohttp.ClientSession(headers=headers, connector=connector) as session:

        async def worker(lead, i, total):
            async with sem:
                try:
                    res = await enrich_one(session, lead)
                except Exception as e:
                    res = {
                        "siren": lead.get("siren"),
                        "nom": lead.get("nom"),
                        "domain": "", "website": "", "phones": [], "emails": [],
                        "linkedin": "", "sources": [f"error:{type(e).__name__}"]
                    }
                if (i + 1) % 25 == 0 or i == total - 1:
                    pct = (i + 1) * 100 // total
                    print(f"  [{i+1}/{total} {pct}%]", file=sys.stderr)
                return res

        tasks = [worker(l, i, len(leads)) for i, l in enumerate(leads)]
        return await asyncio.gather(*tasks)


def fetch_leads_from_api() -> list[dict[str, Any]]:
    """Fetch les leads bruts via l'API Annuaire Entreprises (sync, fast)."""
    import requests
    DEPTS = ["75", "77", "78", "91", "92", "93", "94", "95"]
    UA = {"User-Agent": "DSPilot/1.0 (contact: ousmane@dspilot.fr)"}
    out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for dept in DEPTS:
        page = 1
        while True:
            r = requests.get(
                "https://recherche-entreprises.api.gouv.fr/search",
                params={
                    "activite_principale": "49.41B",
                    "departement": dept,
                    "etat_administratif": "A",
                    "tranche_effectif_salarie": "11,12,21,22",
                    "page": page,
                    "per_page": 25,
                },
                headers=UA, timeout=15,
            )
            r.raise_for_status()
            data = r.json()
            for item in data.get("results", []):
                siren = item.get("siren")
                if not siren or siren in seen:
                    continue
                if item.get("categorie_entreprise") == "GE":
                    continue
                seen.add(siren)
                out.append({
                    "siren": siren,
                    "nom": item.get("nom_complet") or item.get("nom_raison_sociale") or "",
                })
            if page >= data.get("total_pages", 0):
                break
            page += 1
    return out


def main() -> int:
    json_path = Path("/tmp/dsp-idf-leads.json")
    if json_path.exists():
        with open(json_path) as f:
            leads = json.load(f)
    else:
        print("[Enrich] Pull leads via API Annuaire Entreprises…", file=sys.stderr)
        leads = fetch_leads_from_api()
        with open(json_path, "w") as f:
            json.dump(leads, f, ensure_ascii=False)
        print(f"[Enrich] {len(leads)} leads sauvés dans {json_path}", file=sys.stderr)

    print(f"[Enrich] {len(leads)} leads à enrichir (concurrency={CONCURRENCY})…", file=sys.stderr)
    t0 = time.time()
    enriched = asyncio.run(main_async(leads))
    elapsed = time.time() - t0

    out_path = Path("/tmp/dsp-idf-enriched.json")
    with open(out_path, "w") as f:
        json.dump(enriched, f, ensure_ascii=False, indent=1)

    n_with_domain = sum(1 for e in enriched if e["domain"])
    n_with_phone = sum(1 for e in enriched if e["phones"])
    n_with_email = sum(1 for e in enriched if e["emails"])
    n_with_li = sum(1 for e in enriched if e["linkedin"])
    n_proc = sum(1 for e in enriched if e["procedure"])
    print(
        f"[Enrich] DONE en {elapsed:.0f}s. "
        f"Domain: {n_with_domain}/{len(enriched)} ({n_with_domain*100//len(enriched)}%) "
        f"| Phone: {n_with_phone} ({n_with_phone*100//len(enriched)}%) "
        f"| Email: {n_with_email} ({n_with_email*100//len(enriched)}%) "
        f"| LinkedIn: {n_with_li} ({n_with_li*100//len(enriched)}%) "
        f"| Procédure (mort): {n_proc} ({n_proc*100//len(enriched)}%)",
        file=sys.stderr,
    )
    print(f"[Enrich] → {out_path}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
