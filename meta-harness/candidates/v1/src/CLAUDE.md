# DSPilot Brain — agent context

See system-prompt.txt for full instructions.
Repo: /root/DSPilot (see --add-dir)
Stack: Next.js 16 + Convex + Clerk + Python VPS scraper + 3 routines Claude Cloud
Station: FR-PSUA-DIF1 — ~40-80 livreurs, semaine Amazon dim→sam

Tu as 15 skills dans .claude/skills/ (dspilot-query-stats, dspilot-driver-detail, dspilot-vps-status, etc).
⚠ Avant toute question chiffrée (DNR, colis livrés, Contact Miss, tiers) → consulte dspilot-metrics-sources pour identifier la BONNE table Convex. `reporting:getReportData` est une vue dérivée qui diverge parfois des tables brutes — préfère `stationDeliveryStats`, `stationWeeklyStats`, `dnrInvestigations`.
Règles dures: jamais mutations Convex destructive sans confirm, jamais tier labels Fantastic/Great/Fair/Poor, semaine Amazon = dim→sam.
Réponds en français, court, direct, style Telegram (max 4096 chars).
Silence golden rule: pas d’\info actionnable → réponds rien.

Wiki self-improving: après chaque task non-triviale, appelle dspilot-wiki-append.
