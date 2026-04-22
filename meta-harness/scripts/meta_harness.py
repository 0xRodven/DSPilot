#!/usr/bin/env python3
"""
meta_harness.py — Propose/eval/log loop for DSPilot Brain harness.

Ported (simplified) from stanford-iris-lab/meta-harness TB2 reference.
Key differences:
  - Candidates are directories of harness files (skills/, rules/, CLAUDE.md…)
  - Eval = `runner.py` + `scorer.py` on a JSONL eval_set
  - No Docker, no Harbor; just claude CLI subprocesses

Usage:
    python meta_harness.py --eval-only baseline          # baseline only
    python meta_harness.py --iterations 1                # 1 propose+eval cycle
    python meta_harness.py --iterations 5 --concurrency 2

Directory layout (relative to meta-harness/):
    baseline_harness/          # v0
    candidates/v1..vN/         # proposed
    logs/frontier.json         # best-so-far
    logs/iterations.jsonl      # every iteration row
    prompt-templates/dspilot-proposer.md
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BASELINE = REPO / "baseline_harness"
CANDIDATES = REPO / "candidates"
LOGS = REPO / "logs"
EVAL_SET = REPO / "eval_set.jsonl"
HOLDOUT_SET = REPO / "holdout_set.jsonl"
PROPOSER_TMPL = REPO / "prompt-templates" / "dspilot-proposer.md"
RUNNER_SCRIPT = REPO / "scripts" / "runner.py"
SCORER_SCRIPT = REPO / "scripts" / "scorer.py"
FRONTIER = LOGS / "frontier.json"
ITERATIONS_LOG = LOGS / "iterations.jsonl"

LOGS.mkdir(parents=True, exist_ok=True)
CANDIDATES.mkdir(parents=True, exist_ok=True)


def ts() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def next_candidate_id() -> str:
    existing = sorted(p.name for p in CANDIDATES.iterdir() if p.is_dir() and p.name.startswith("v"))
    nums = []
    for n in existing:
        try:
            nums.append(int(n[1:]))
        except ValueError:
            continue
    n = (max(nums) + 1) if nums else 1
    return f"v{n}"


def eval_candidate(candidate_dir: Path, eval_set: Path, concurrency: int = 1, model: str = "claude-opus-4-7") -> dict:
    """Run runner.py then scorer.py on a candidate. Returns aggregate score dict."""
    print(f"\n=== Eval: {candidate_dir.name} ===")
    t0 = time.time()

    r = subprocess.run(
        [
            sys.executable,
            str(RUNNER_SCRIPT),
            "--candidate",
            str(candidate_dir),
            "--eval-set",
            str(eval_set),
            "--concurrency",
            str(concurrency),
            "--model",
            model,
        ],
        cwd=str(REPO),
    )
    if r.returncode != 0:
        print(f"  runner failed exit={r.returncode}")
        return {"accuracy": 0.0, "error": "runner_failed"}

    r = subprocess.run(
        [
            sys.executable,
            str(SCORER_SCRIPT),
            "--candidate",
            str(candidate_dir),
            "--eval-set",
            str(eval_set),
        ],
        cwd=str(REPO),
    )
    if r.returncode != 0 and (candidate_dir / "score.json").exists() is False:
        return {"accuracy": 0.0, "error": "scorer_failed"}

    score_file = candidate_dir / "score.json"
    if not score_file.exists():
        return {"accuracy": 0.0, "error": "no_score"}

    score = json.loads(score_file.read_text())
    agg = score["aggregate"]
    agg["wall_seconds"] = round(time.time() - t0, 1)
    return agg


def read_frontier() -> dict:
    if FRONTIER.exists():
        return json.loads(FRONTIER.read_text())
    return {"candidate": None, "accuracy": 0.0}


def write_frontier(candidate_name: str, agg: dict) -> None:
    FRONTIER.write_text(
        json.dumps(
            {"candidate": candidate_name, "accuracy": agg["accuracy"], "agg": agg, "updated_at": ts()},
            indent=2,
        )
    )


def log_iteration(row: dict) -> None:
    with ITERATIONS_LOG.open("a") as f:
        f.write(json.dumps(row) + "\n")


def load_proposer_prompt() -> str:
    if not PROPOSER_TMPL.exists():
        raise FileNotFoundError(f"Missing {PROPOSER_TMPL}")
    return PROPOSER_TMPL.read_text()


def propose_next(prev_results: dict, iteration: int, timeout: int = 1800) -> Path | None:
    """
    Spawn a Claude Code CLI in proposer mode. The proposer reads candidates/ +
    logs/ via its filesystem tools, writes a new candidates/vN/ directory, and
    terminates.
    """
    prompt = load_proposer_prompt()
    prompt += f"\n\nIteration: {iteration}\nPrevious results:\n{json.dumps(prev_results, indent=2)}\n"

    env = os.environ.copy()
    env.pop("ANTHROPIC_API_KEY", None)

    cmd = [
        "claude",
        "-p",
        prompt,
        "--model",
        "claude-opus-4-7",
        "--output-format",
        "stream-json",
        "--verbose",
        "--dangerously-skip-permissions",
        "--add-dir",
        str(REPO),
    ]

    t0 = time.time()
    try:
        r = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=timeout, cwd=str(REPO))
    except subprocess.TimeoutExpired:
        print(f"  proposer timed out after {timeout}s")
        return None
    wall = time.time() - t0
    print(f"  proposer finished exit={r.returncode} wall={wall:.0f}s")

    if r.returncode != 0:
        print(f"  stderr[:500]: {r.stderr[:500]}")

    # Find the new candidate the proposer wrote
    existing_before = {p.name for p in CANDIDATES.iterdir() if p.is_dir() and p.name.startswith("v")}
    # Assume proposer already created candidates/vN
    new = sorted(p for p in CANDIDATES.iterdir() if p.is_dir() and p.name.startswith("v"))
    if not new:
        return None
    return new[-1]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--eval-only", help="candidate name to eval (e.g. baseline or v3)")
    p.add_argument("--iterations", type=int, default=0)
    p.add_argument("--concurrency", type=int, default=1)
    p.add_argument("--model", default="claude-opus-4-7")
    p.add_argument("--eval-set", default=str(EVAL_SET))
    args = p.parse_args()

    eval_set = Path(args.eval_set)

    # Baseline bootstrap — symlink into candidates/v0 if not already there
    v0 = CANDIDATES / "v0"
    if not v0.exists():
        v0.symlink_to(BASELINE)

    if args.eval_only:
        candidate = BASELINE if args.eval_only in ("baseline", "v0") else CANDIDATES / args.eval_only
        agg = eval_candidate(candidate, eval_set, args.concurrency, args.model)
        print(json.dumps(agg, indent=2))
        fr = read_frontier()
        if agg.get("accuracy", 0) > fr.get("accuracy", 0):
            write_frontier(candidate.name, agg)
        return

    if args.iterations == 0:
        print("Nothing to do. Use --eval-only or --iterations N.")
        return

    # Ensure baseline is evaluated once
    fr = read_frontier()
    if fr.get("candidate") is None:
        print("No frontier yet — evaluating baseline first")
        agg = eval_candidate(BASELINE, eval_set, args.concurrency, args.model)
        write_frontier("baseline", agg)
        log_iteration({"iteration": 0, "candidate": "baseline", "agg": agg, "at": ts()})

    for i in range(1, args.iterations + 1):
        print(f"\n======= Iteration {i}/{args.iterations} =======")
        fr = read_frontier()
        t0 = time.time()
        new_dir = propose_next(prev_results=fr, iteration=i)
        propose_s = time.time() - t0
        if new_dir is None:
            print("  proposer did not produce a candidate — skipping")
            log_iteration({"iteration": i, "outcome": "proposer_failed", "propose_s": round(propose_s, 1), "at": ts()})
            continue
        agg = eval_candidate(new_dir, eval_set, args.concurrency, args.model)
        delta = agg.get("accuracy", 0) - fr.get("accuracy", 0)
        better = delta > 0
        log_iteration({
            "iteration": i,
            "candidate": new_dir.name,
            "agg": agg,
            "delta_vs_frontier": round(delta, 3),
            "propose_s": round(propose_s, 1),
            "at": ts(),
        })
        if better:
            write_frontier(new_dir.name, agg)
            print(f"  NEW FRONTIER: {new_dir.name} acc={agg['accuracy']:.1%} (+{delta:.1%})")
        else:
            print(f"  no improvement: {new_dir.name} acc={agg['accuracy']:.1%} (Δ={delta:+.1%})")

    print("\nDone.")


if __name__ == "__main__":
    main()
