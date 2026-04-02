---
name: amazon-scraper-ops
description: VPS operations guide for Amazon Logistics scraper and data pipeline. Covers cron jobs, cookies, backfill, and environment setup. Use when working with Amazon data ingestion.
allowed-tools: Read, Write, Edit, Bash
---

# Amazon Scraper Operations

## VPS Paths

- Source code: `/root/DSPilot/`
- Secrets: `/root/.secrets/dspilot.env`
- Amazon cookies: `/root/.secrets/amazon-logistics-cookies.json`
- Automation scripts: `/root/.openclaw/workspace-dspilot/scripts/`
- Automation logs: `/root/.openclaw/workspace-dspilot/logs/amazon-automation/`
- Browser profile: `/root/.openclaw/workspace-dspilot/state/amazon-browser-profile/`
- Stealth browser venv: `/root/.claude/stealth-browser-mcp/venv/`
- Backfill artifacts: `/root/DSPilot/.artifacts/amazon-live/`

## Cron Jobs (systemd timers)

- Daily scrape: 05:35 UTC
- Weekly scrape: Monday 04:10 UTC
- Healthcheck: every 15 minutes

## Environment Setup

```bash
set -a && source /root/.secrets/dspilot.env && set +a
# OR use the wrapper:
python3 /root/.openclaw/workspace-dspilot/scripts/with-dspilot-env.py <command>
```

## Running Ingestion

```bash
export NEXT_PUBLIC_CONVEX_URL="https://sincere-rhinoceros-718.convex.cloud"
export CONVEX_DEPLOY_KEY="prod:sincere-rhinoceros-718|..."
npm run amazon:ingest -- --station-code FR-PSUA-DIF1 --artifacts-dir <path> --imported-by system:manual
```

## Amazon Week Format

- Amazon uses Sunday-Saturday weeks (NOT ISO Monday-Sunday)
- Code uses `getWeek(now, { weekStartsOn: 0 })` to match
- File naming: `DWC-IADC-Report_2026-06.html` = Amazon week number

## Backfill Multi-Weeks

- `DSPILOT_AMAZON_WEEKS=13` downloads 13 folders but only ingests the FIRST week
- For full backfill: loop over each `week-XX-YYYY/` subfolder
- IMPORTANT: Copy `all_associates.html` (roster) from run root into each week subfolder before ingestion

## Cookie Management

- Cookies at `/root/.secrets/amazon-logistics-cookies.json` (WebExtension JSON format)
- Expiration: ~1 year but Amazon can invalidate earlier
- Scraper exit code 42 = `reauth_required` — Ousmane must export fresh cookies from browser
- Browser: nodriver (Python async CDP) with stealth venv

## Full Scrape Cycle

```bash
set -a && source /root/.openclaw/workspace-dspilot/config/amazon-automation.env && set +a
bash /root/.openclaw/workspace-dspilot/scripts/run-amazon-live-cycle.sh
```

## DO NOT

- Run scraper without fresh cookies (check expiry first)
- Forget to copy roster file into week subfolders for backfill
- Use `source` without `set -a` (variables won't export)
- Ingest into wrong Convex deployment (check CONVEX_DEPLOY_KEY prefix)
