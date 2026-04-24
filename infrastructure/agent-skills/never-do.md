---
name: never-do
description: Hard constraints and known traps for the DSPilot Brain agent. Read this FIRST before any data query or shell command.
---

# never-do — pièges connus à éviter

## Règles absolues

### 1. Semaines Amazon = dimanche → samedi

**JAMAIS** utiliser `getISOWeek` (ISO = lundi-dimanche) pour du data Amazon.

✅ TOUJOURS `getWeek(date, { weekStartsOn: 0 })` en JS/TS
✅ En Python : `datetime.strftime('%U')` (Sunday-starts) ou filter manuellement
✅ Vérifier contre `stationDeliveryStats.week` existant avant de rapporter un chiffre

### 2. DNR : entryType="concession" ≠ entryType="investigation"

Quand on dit "102 DNR cette semaine", c'est **concessions uniquement**.

```bash
# ❌ faux — mélange les 2 types (retourne 110 pour DIF1 S16)
jq 'select(.year==2026 and .week==16)' /tmp/dnr.jsonl | wc -l

# ✅ correct
jq 'select(.year==2026 and .week==16 and .entryType=="concession")' /tmp/dnr.jsonl | wc -l
```

Le chiffre réel DIF1 S16 = **102 concessions + 8 investigations = 110 entries**. Quand Ousmane dit "DNR S16 = 102", c'est les concessions.

### 3. Colis livrés ≠ DWC-scope count

**NEVER** confondre ces 2 chiffres :

- `stationDeliveryStats.numericValue` (metricName="Colis livrés") = vrai nombre de colis scraped depuis Aperçu Amazon officiel (22 337 pour DIF1 S16)
- Somme `driverAssociateStats.deliveries` = subset des livreurs associés à la station (pas tous)
- `driverWeeklyStats.dwcCompliant + dwcMisses` = count DWC scope (86% des vrais colis)

Si user demande "combien de colis S16" → afficher **Colis livrés Aperçu** (22 337), pas le DWC scope (17 385).

### 4. Station code vs name

- Code = `FR-PSUA-DIF1` (format Amazon officiel)
- Name = `DIF1` (raccourci)
- Search always by `code` si user dit "station DIF1" (elle est stockée avec code `FR-PSUA-DIF1`)

### 5. Multi-tenant : TOUJOURS filtrer par stationId

**JAMAIS** query sans filtre `stationId` ou `organizationId`. Sinon risque leak cross-tenant.

```bash
# ❌ faux
jq 'select(.year==2026 and .week==16)' /tmp/dws.jsonl

# ✅ correct
STATION_ID="m5793emg00bwkq7n082dyrp4kd841cak"
jq --arg sid "$STATION_ID" 'select(.year==2026 and .week==16 and .stationId==$sid)' /tmp/dws.jsonl
```

### 6. CONVEX_DEPLOY_KEY déjà dans l'env

L'env VPS a déjà `CONVEX_DEPLOY_KEY` loadé via `/root/.secrets/dspilot.env`. Ne pas le chercher dans `.env.local`, `.env`, ou ailleurs. Si `npx convex` échoue avec "deploy key not found" → debug pourquoi l'env n'est pas propagé, ne pas re-générer de clé.

### 7. /tmp et ES modules

Si tu crées un script Node `/tmp/script.mjs` pour une query ad-hoc :
- ✅ extension `.mjs` pour ES modules OU `.cjs` pour CommonJS — ne **jamais** mélanger
- ✅ `import fs from 'fs'` (ES) OU `const fs = require('fs')` (CJS)
- ❌ JAMAIS `.js` avec des `import` dans un dossier qui n'a pas `"type":"module"` dans son package.json (crash silent)

### 8. Ne pas inventer de données

Si tu n'as pas la donnée, **dis-le explicitement** :

```
"Le chiffre pour S17 est encore partiel (data complète samedi soir). D'après ce qu'on a pour l'instant : 41 concessions DIF1."
```

**JAMAIS** extrapoler ou inventer un chiffre pour remplir la réponse.

### 9. Tier classification (DWC %)

```
fantastic >= 95
great     >= 90
fair      >= 88
poor       < 88
```

Toujours utiliser ces seuils. Jamais réinventer (ex: "très bon = 92%" est faux).

### 10. Ne pas exécuter de commande destructive sans confirmation

**INTERDIT sans ok user** : `rm -rf`, `DROP TABLE`, `git push --force`, `git reset --hard`, `systemctl stop` sur service critique, purge Convex table.

Pour tâches d'analyse, **read-only strict**.

## Stop et demande si :

- Tu dois effacer/réécrire un fichier en prod (ex: `/root/.secrets/*`)
- Tu dois redémarrer un service (ex: `systemctl restart dspilot-amazon-unified`)
- Tu reçois une question qui mélange 2 stations (bot actuellement solo-tenant DIF1)
- Tu détectes un delta > 20% sur un chiffre clé (suspicieux — peut être bug scraper)

## Avant de répondre — checklist (mental)

- [ ] J'ai bien filtré par `stationId` et `organizationId` ?
- [ ] Le chiffre vient d'une source fiable (Convex prod) ?
- [ ] La semaine est complète (si weekly) ?
- [ ] Je n'ai pas mélangé concession/investigation sur DNR ?
- [ ] Je n'ai pas mélangé Colis livrés / DWC scope ?
- [ ] Mon output est actionnable (pas juste informatif) ?
