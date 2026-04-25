---
name: dspilot-vps-status
description: État des systemd timers VPS + disk + process DSPilot scraper. Use quand user demande "vps ok ?", "le scraper a tourné ?", "disk plein ?".
---

# dspilot-vps-status

Diagnostic rapide du VPS Hetzner openclaw côté DSPilot (le brain agent lui-même est sur ce VPS, donc `ssh` pas nécessaire — cmd locales).

## Pattern exécution

```bash
echo "=== Systemd timers DSPilot ==="
systemctl list-timers 'dspilot-amazon-*' --no-pager 2>&1 | head -8

echo ""
echo "=== Last unified run ==="
systemctl show dspilot-amazon-unified.service -p Result -p ExecMainStartTimestamp --value | head -4

echo ""
echo "=== Disk usage ==="
df -h /root | head -2

echo ""
echo "=== Memory ==="
free -h | head -2

echo ""
echo "=== Amazon session age ==="
ls -la /root/.openclaw/workspace-dspilot/amazon-automation/*.json 2>/dev/null | tail -3
```

## Output (compact)

```
Timers:
  dspilot-amazon-unified: next 04h30 UTC tomorrow (last: ✓ 04h35 8h ago)
  dspilot-amazon-health:  next in 3 min
Disk: 17% (48G / 295G)
RAM: 2.1G / 4G used
Session: last refresh 12h ago ✓
```

## Alertes

- Disk > 85% → "⚠ DISK FULL"
- Last unified > 30h → "⚠ scraper en retard"
- Session > 24h → "⚠ cookies Amazon à refresh"
- OOMKiller dans journal → "⚠ memory pressure"
