# Wiki Ingest — Ingérer une source dans le wiki

Ingère un fichier du dossier `~/wiki/raw/` dans le wiki DSPilot (pattern Karpathy).

## Processus

1. **Lire le schema** — `~/wiki/CLAUDE.md` pour les conventions
2. **Lire la source** — Le fichier dans `~/wiki/raw/` indiqué par l'utilisateur
3. **Analyser** — Extraire les concepts clés, entités, faits importants
4. **Lire l'index** — `~/wiki/wiki/index.md` pour voir les pages existantes
5. **Créer/Mettre à jour les pages wiki** :
   - Page Source avec résumé et takeaways
   - Pages Concept/Entité existantes mises à jour si nouvelles infos
   - Nouvelles pages si concepts non couverts
   - `[[wikilinks]]` bidirectionnels
6. **Mettre à jour l'index** — `~/wiki/wiki/index.md`
7. **Appendre au log** — `~/wiki/wiki/log.md` avec format :
   ```
   ## [YYYY-MM-DD] ingest | Nom Source
   - Pages créées : ...
   - Pages mises à jour : ...
   - Takeaway principal : ...
   ```
8. **Mettre à jour hot.md** — Si le contexte actif change

## Conventions

- Frontmatter obligatoire : tags, sources, updated, confidence
- Pages en kebab-case, contenu en français
- Max ~500 mots par page, splitser si plus long
- Flat structure (pas de sous-dossiers dans wiki/)

## Argument

$ARGUMENTS — Nom ou chemin du fichier dans raw/ à ingérer
