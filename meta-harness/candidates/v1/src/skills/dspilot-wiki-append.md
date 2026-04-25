---
name: dspilot-wiki-append
description: Ajoute un apprentissage au wiki ~/wiki/. Appeler APRÈS une task non-triviale pour capturer pattern/bugfix/décision.
---

# dspilot-wiki-append

Post-task learning capture. Pattern Karpathy self-improving wiki.

## Format entrée type

Création dans `~/wiki/wiki/learnings/YYYY-MM-DD-{slug}.md` :

```markdown
---
title: "{titre court descriptif}"
date_created: YYYY-MM-DD
tags: [domain1, domain2]
keywords: ["keyword1", "keyword2"]
status: hot
lesson_type: bug-fix | pattern | gotcha | anti-pattern | performance | discovery
---

## Task
{1 phrase : ce qui était demandé}

## What Worked
- {bullet, 1 ligne}

## What Failed (if applicable)
- {bullet, 1 ligne}

## Pattern Extracted
- {1-2 lignes, réutilisable sur d'autres tasks}

## Files Modified
- `path/to/file.ts` — {ligne / fonction}

## Next Time
- {gotcha à retenir pour la prochaine fois}
```

## Pattern exécution

```bash
# 1. Sync wiki avant write (évite conflits)
cd ~/wiki && git pull --rebase -q

# 2. Check si une entrée similaire existe déjà (dedup)
KEYWORDS="scraper UNKNOWN retry"
rg -l "$KEYWORDS" ~/wiki/wiki/ 2>/dev/null | head

# 3. Si oui → append date + new insight à l'existant
# Si non → créer nouveau fichier dans learnings/

SLUG="scraper-unknown-retry"
DATE=$(date +%Y-%m-%d)
FILE=~/wiki/wiki/learnings/${DATE}-${SLUG}.md

cat > "$FILE" <<EOF
---
...
EOF

# 4. Update hot-DSPilot.md avec lien
echo "- [$DATE: $SLUG](learnings/${DATE}-${SLUG}.md)" >> ~/wiki/wiki/hot-DSPilot.md

# 5. Commit + push
cd ~/wiki
git add -A
git commit -m "wiki: $SLUG ($(date +%Y-%m-%d))"
git push
```

## Règles

- **Jamais** de dump complet (max 30 lignes par entrée)
- **Toujours** capture les failures négatifs (très valuable)
- **Jamais** de secrets / tokens
- **Toujours** link back aux fichiers code avec line numbers
- **Évite** les doublons — lint avant write
