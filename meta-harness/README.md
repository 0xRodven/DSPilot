# DSPilot Meta-Harness

Automated search loop over DSPilot Brain's harness (system prompt + skills + hooks).
Adapted from [stanford-iris-lab/meta-harness](https://github.com/stanford-iris-lab/meta-harness).

## TL;DR

- **Goal** : instead of Ousmane tuning the agent's skills/prompt by hand, let a
  Claude Code proposer read past session traces, diagnose recurring failure modes,
  and propose incremental edits scored on a reproducible 15-question eval set.
- **Baseline** : the harness currently deployed on VPS (`/opt/dspilot-agent/.claude/`)
- **Iteration budget** : ~5€/week, ~15 min wall-clock per propose+eval cycle.

## Layout

```
meta-harness/
├── domain_spec.md              # this-domain doc per Stanford ONBOARDING
├── eval_set.jsonl              # 15 search-set questions + expected
├── holdout_set.jsonl           # 10 held-out questions (evaluated once after N iters)
├── baseline_harness/           # v0 = rsync'd from VPS
├── candidates/                 # v1..vN : proposals + runs + scores
├── logs/
│   ├── frontier.json           # best-so-far
│   └── iterations.jsonl        # history
├── prompt-templates/
│   ├── dspilot-proposer.md     # prompt for the proposer agent
│   ├── dspilot-runner.md       # wraps each eval question in a Telegram-like frame
│   └── dspilot-judge.md        # LLM-as-judge (haiku) prompt
└── scripts/
    ├── meta_harness.py         # propose/eval/log loop
    ├── runner.py               # spawn claude CLI with harness mounted
    ├── scorer.py               # regex + judge scoring
    ├── claude_wrapper.py       # ported from Stanford TB2
    └── anthropic_caching.py    # ported from Stanford TB2
```

## Quick commands

```bash
cd meta-harness

# Smoke test — 1 question on baseline, see that pipeline works
python scripts/runner.py --candidate baseline_harness --only q01_dif1_dnr_s16

# Score whatever was produced
python scripts/scorer.py --candidate baseline_harness --only q01_dif1_dnr_s16

# Evaluate the full 15-question set on baseline
python scripts/meta_harness.py --eval-only baseline --concurrency 2

# Run 1 full propose + eval iteration
python scripts/meta_harness.py --iterations 1 --concurrency 2

# Check for eval-set leakage in a candidate (should be 0)
python scripts/scorer.py --candidate candidates/v3 --check-leakage
```

## How the loop works

1. `runner.py` copies a candidate's harness (CLAUDE.md, skills/, hooks/, settings.json)
   into `$HOME = /tmp/mh-runner-XXXX/` and spawns `claude -p <question>` with
   stream-json output captured. OAuth credentials are copied from `~/.claude/.credentials.json`.

2. `scorer.py` reads each run's `reply.txt` and matches against `expected_regex`
   or invokes `claude-haiku-4-5` as LLM-as-judge using `dspilot-judge.md`.
   Aggregates into `<candidate>/score.json`.

3. `meta_harness.py` orchestrates : eval baseline → read frontier → spawn proposer
   (Claude Opus with access to `candidates/` + `logs/`, never `eval_set.jsonl`) →
   proposer writes `candidates/v(N+1)/src/` → eval → compare to frontier → log.

## Deployment of a winner

None yet automated. When a candidate beats baseline by > 5 points accuracy
AND variance < 2 points across N=2 trials :

```bash
# 1. Diff against live VPS harness
rsync -avn candidates/vX/ openclaw:/opt/dspilot-agent/.claude/ --dry-run

# 2. Apply + restart (manual approval)
rsync -av candidates/vX/skills/ openclaw:/opt/dspilot-agent/.claude/skills/
rsync -av candidates/vX/CLAUDE.md openclaw:/opt/dspilot-agent/CLAUDE.md
ssh openclaw "systemctl restart dspilot-telegram-agent.service"
```

## Costs + limits

- Per question : ~40s Opus (complex) or 10s (simple) ; ~$0.05 avg
- Per full eval (15Q × 1 trial) : ~$0.75 ; ~5 min @ concurrency=2
- Per iteration (baseline + v1 eval + proposer) : ~$2.50 ; ~15 min
- Max concurrency : 4 (rate-limit Claude Max subscription)

## See also

- `../spec/ARCHITECTURE.md` — DSPilot overall architecture
- Stanford paper : arXiv 2603.28052 "Meta-Harness: End-to-End Optimization of Model Harnesses"
- Reference impl : https://github.com/stanford-iris-lab/meta-harness
