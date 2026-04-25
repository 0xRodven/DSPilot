---
name: dspilot-scraper-control
description: Trigger scrape Amazon manuel, refresh cookies, tail logs. Use quand user dit "relance le scrape", "cookies expirés", "logs scraper".
---

# dspilot-scraper-control

Contrôle des scrapers Amazon (VPS systemd).

## Actions

### Trigger scrape unified (daily + DNR + Associate)

```bash
systemctl start dspilot-amazon-unified.service &
sleep 2
journalctl -u dspilot-amazon-unified.service -n 20 --no-pager
# Le scrape prend ~7 min, tail les logs
```

### Refresh Amazon session (cookies)

```bash
systemctl start dspilot-amazon-session-refresh.service
sleep 30
journalctl -u dspilot-amazon-session-refresh.service -n 10 --no-pager
```

### Tail logs récents

```bash
# Unified
journalctl -u dspilot-amazon-unified.service -n 50 --no-pager | grep -E "ERROR|Success|Batch|upserted"

# Concessions
tail -50 /tmp/dspilot-pipeline/concessions-*.log 2>/dev/null | grep -E "ERROR|Total|upserted"
```

### Scrape semaine spécifique (backfill)

```bash
cd /root/DSPilot
bash scripts/run-concessions-pipeline.sh 16 2026  # Week 16, year 2026
```

## Pièges

- Si `REAUTH_REQUIRED` → session expirée, l'user doit ré-exporter les cookies
- Le scrape unified ne tourne QU'UNE fois à la fois (pas de parallélisme)
- health-check dans le pipeline re-run automatiquement si > 10% UNKNOWN concessions
