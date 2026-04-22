#!/bin/bash
# DSPilot Brain — SessionStart hook
# Exécuté à chaque démarrage de session Claude Code, injecte le contexte.
# Output stdout = injected dans le system prompt.

set -uo pipefail

DSPILOT="/root/DSPilot"
WIKI="/root/wiki/wiki"

echo "=== DSPilot Brain Context ==="
echo ""
echo "Date: $(date -u +%Y-%m-%d\ %H:%M\ UTC)"
echo "Current Amazon week: S$(date -d 'last saturday' '+%V')/$(date -d 'last saturday' '+%Y')"
echo ""

# Wiki hot cache
if [ -f "${WIKI}/hot-DSPilot.md" ]; then
  echo "=== Wiki hot cache (hot-DSPilot.md, truncated) ==="
  head -60 "${WIKI}/hot-DSPilot.md"
  echo ""
fi

# Wiki index (pour savoir où chercher plus loin)
if [ -f "${WIKI}/index.md" ]; then
  echo "=== Wiki index ==="
  head -40 "${WIKI}/index.md"
  echo ""
fi

# Active gotchas from rules
echo "=== DSPilot active rules ==="
for rule in "${DSPILOT}/.claude/rules/always.md" "${DSPILOT}/.claude/rules/convex.md" "${DSPILOT}/.claude/rules/data-import.md"; do
  if [ -f "$rule" ]; then
    echo "--- $(basename $rule) ---"
    head -20 "$rule"
    echo ""
  fi
done

# Live Convex state (last import date + routine health)
# Skip if offline or Convex unreachable
(
  cd "${DSPILOT}" 2>/dev/null || exit 0
  source /root/.secrets/dspilot.env 2>/dev/null || exit 0

  # Clean CONVEX_DEPLOY_KEY if concatenated
  case "${CONVEX_DEPLOY_KEY:-}" in
    *DSPILOT_*) export CONVEX_DEPLOY_KEY="${CONVEX_DEPLOY_KEY%%DSPILOT_*}" ;;
  esac

  [ -z "${CONVEX_DEPLOY_KEY:-}" ] && exit 0

  echo "=== Live Convex state ==="
  timeout 10 npx convex data --prod reportDeliveries --limit 3 --format jsonl 2>/dev/null | \
    head -3 | \
    python3 -c "
import json, sys
for line in sys.stdin:
    try:
        r = json.loads(line)
        ts = r.get('createdAt', 0)
        from datetime import datetime
        dt = datetime.fromtimestamp(ts/1000).strftime('%Y-%m-%d %H:%M')
        print(f\"  {dt} | {r.get('reportType')} | {r.get('title', '')[:60]}\")
    except: pass
" || true
  echo ""
) || true

# Systemd timers status
echo "=== VPS timers status ==="
systemctl list-timers 'dspilot-amazon-*' --no-pager 2>/dev/null | head -6 || echo "(systemctl unavailable)"
echo ""

echo "=== END context ==="
