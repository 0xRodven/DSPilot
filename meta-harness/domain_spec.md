# Domain Spec: DSPilot Brain Harness

## Domain Summary

**Task.** DSPilot Brain est un agent Claude Code Opus 4.7 qui tourne 24/7 sur
un VPS Hetzner, connecté à Telegram via le plugin officiel `claude-plugins-official/telegram`.
Il répond aux questions d'Ousmane (DSP manager, station Amazon DIF1, ~60 livreurs)
sur les stats de la flotte, les DNR, le coaching, les alertes, etc.

**Unit of evaluation.** Une question Telegram → une réponse de l'agent. Mesurée
sur un eval-set reproductible de 15 questions (plus 10 holdout) avec réponses
vérifiables (regex ou LLM-as-judge).

**Fixed.** Le modèle de base (Opus 4.7), l'infra VPS systemd, le plugin Telegram,
la BDD Convex prod, le scraper Amazon.

**Allowed to change.** Le dossier `baseline_harness/` :
- `CLAUDE.md` (system prompt concis au niveau HOME du harness)
- `skills/*.md` (7 skills DSPilot actuels)
- `hooks/session-start.sh` (contexte injecté au démarrage)
- `settings.json` (perms + enabled plugins)

**Base model.** `claude-opus-4-7` via compte Anthropic Max (OAuth).

**Budget optimisation.**
- Setup initial : 1 journée wall-clock, ~20€ API
- Boucle hebdo : ~5€/semaine (1 itération = eval 15Q baseline + eval 15Q candidat = 30 runs Opus + ~15 Haiku judge calls ≈ 3-5€)
- Wall-clock par itération : ~15 min propose + ~10 min eval (concurrence=2)

---

## Harness and Search Plan

**Candidate shape.** Un candidat = dossier `candidates/vN/` contenant les
mêmes fichiers que `baseline_harness/` :
```
candidates/vN/
├── CLAUDE.md
├── settings.json
├── skills/*.md
├── hooks/session-start.sh
├── notes.md            # proposer's rationale
└── runs/<qid>/         # populated by runner.py
    ├── reply.txt
    ├── trace.jsonl
    ├── metrics.json
    └── score.json
```

**Baselines.**
- `v0-baseline` : harness actuelle sur VPS (telle qu'extraite 2026-04-22).
- (Optionnel après) `v0-minimal` : CLAUDE.md tout seul sans skills, pour mesurer la valeur ajoutée des skills.

**Reusable helpers.**
- `scripts/claude_wrapper.py` (porté de Stanford TB2, non modifié)
- `scripts/anthropic_caching.py` (porté, non utilisé pour l'instant mais dispo)
- `scripts/runner.py` (spawn claude CLI dans HOME isolé)
- `scripts/scorer.py` (regex + LLM-as-judge haiku)
- `scripts/meta_harness.py` (loop propose/eval/log)

**First search loop.**
1. Eval baseline (v0) → frontier initial accuracy
2. Propose v1 (proposer lit v0 runs/, identifie 1 failure mode, écrit v1/src/)
3. Eval v1 → compare à frontier
4. Si delta > 0 → nouveau frontier, sinon log + continuer
5. Itérer 3-5 fois puis check holdout

---

## Evaluation Plan

**Search set.** `eval_set.jsonl` — 15 questions en 4 catégories :
- `station-stats` (6Q) : DNR, colis livrés, DWC station, tier distribution, etc.
- `driver-stats` (5Q) : DWC/jours/contact miss d'un driver nommé × S16
- `ops-knowledge` (1Q) : convention semaine Amazon
- `silence-rule` (1Q) : refus de répondre sur entité inconnue (Jean Dupont)
- `concepts` : (dans holdout)

Chaque question a soit `expected_regex` (match simple sur la réponse), soit
`judge_prompt` (rubrique LLM-as-judge en haiku), soit les deux (regex en
priorité, judge en fallback).

**Held-out test set.** `holdout_set.jsonl` — 10 questions jamais vues pendant
la recherche. Évalué une seule fois après N=5 itérations pour détecter overfitting.

**Métriques.**
- Principal : `accuracy` = correct / total
- Secondaires :
  - `mean_wall_s` : latence moyenne par Q
  - `total_cost_usd` : coût API total
  - `mean_tool_calls` : moyenne d'outils appelés par Q
  - `leaks` : nombre de questions dont expected_regex match littéralement dans les skills du candidat (anti-cheat)

**Noise.** Claude Opus non-zero-temperature → variance inter-run. Mitigation :
`DEFAULT_SEARCH_TRIALS = 1` pour l'instant (baseline accuracy stable visuellement) ;
passer à 2 si variance observée > 0.1.

**Runtime par candidat.** ~10 min pour 15 Q avec concurrence=2 (~40s/Q).

**Contamination/leakage.**
- `scorer.py --check-leakage` grep les `expected_regex` dans les skills du candidat
- Les ground_truth dans `eval_set.jsonl` ne sont PAS accessibles au proposer (il ne peut pas lire `eval_set.jsonl`, juste les réponses dans `runs/`)
- Holdout non exposé au proposer

---

## Experience and Logging

**Offline traces.** Transcripts Telegram des 7 derniers jours sur VPS
`/opt/dspilot-agent/.claude/projects/*.jsonl`. Peuvent être rsync'd dans
`offline-traces/` pour que le proposer ait du matériel diagnostique.

**Documents de référence.**
- `/Users/ousmane/Desktop/DSPilot/CLAUDE.md`
- `/Users/ousmane/Desktop/DSPilot/.claude/rules/*.md`
- `~/wiki/wiki/hot-DSPilot.md` (si rsync'd)

**Online traces per candidate (runs/<qid>/).**
- `reply.txt` : réponse agent
- `trace.jsonl` : full Claude Code session transcript (tools appelés, reasoning)
- `stdout.log` : stream-json brut du subprocess
- `stderr.log` : erreurs
- `metrics.json` : wall_seconds, tool_calls_count, usage, cost_usd, errors
- `score.json` : {correct, method, reasoning}

**Metadata top-level par candidat.**
- `score.json` : aggregate {accuracy, mean_wall_s, total_cost_usd, leaks}
- `notes.md` : rationale du proposer (failure mode observé, modification proposée)

**Directory structure.**
```
meta-harness/
├── domain_spec.md (ce fichier)
├── eval_set.jsonl
├── holdout_set.jsonl
├── baseline_harness/
├── candidates/vN/
├── logs/
│   ├── frontier.json
│   └── iterations.jsonl
├── prompt-templates/
│   ├── dspilot-proposer.md
│   ├── dspilot-runner.md
│   └── dspilot-judge.md
├── scripts/
│   ├── runner.py
│   ├── scorer.py
│   ├── meta_harness.py
│   ├── claude_wrapper.py
│   └── anthropic_caching.py
└── offline-traces/ (rsync'd from VPS, gitignored)
```

**Mini CLI.**
```bash
# Eval baseline only
python scripts/meta_harness.py --eval-only baseline

# Run 1 propose/eval cycle
python scripts/meta_harness.py --iterations 1

# Leak check on a candidate
python scripts/scorer.py --candidate candidates/v3 --check-leakage

# Smoke test (1 question only)
python scripts/runner.py --candidate baseline_harness --only q01_dif1_dnr_s16
```

---

## Open Questions and Unknowns

1. **Variance de l'eval.** Non encore mesurée — besoin de run baseline 3× pour
   décider si `TRIALS=1` suffit ou s'il faut passer à 2.

2. **Coût exact par itération.** Estimé à 3-5€ mais dépend du nombre de tool
   calls que l'agent fait pendant l'eval (certains Q exigent des `convex data` runs).

3. **Authentification CLI isolée.** Le runner copie `.credentials.json` dans
   le HOME temp. Si le OAuth token expire pendant une eval longue, les runs
   tardifs foirent. Mitigation à confirmer : probablement fine pour 10-min runs.

4. **Plugin Telegram indisponible en isolated HOME.** Le candidat évalué n'a pas
   le plugin Telegram actif (pas besoin — on mime via `dspilot-runner.md`).
   Conséquence : les skills qui référencent des tools du plugin ne seront pas
   exercés par l'eval. Mitigation : rester sur des questions stats/ops purement.

5. **Path différences VPS vs Mac dev.** Sur VPS l'agent a `/root/DSPilot` ;
   sur Mac `/Users/ousmane/Desktop/DSPilot`. Le runner passe `--add-dir` avec
   le path Mac. Les skills qui hardcodent `/root/DSPilot` peuvent échouer à
   grepper localement. Mitigation : skills doivent utiliser `$HOME` ou variables.

6. **Déploiement d'un candidat gagnant.** Pas encore automatisé.
   Flow manuel prévu : `rsync meta-harness/candidates/vX/skills/ openclaw:/opt/dspilot-agent/.claude/skills/` + `systemctl restart dspilot-telegram-agent`.
