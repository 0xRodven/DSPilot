#!/usr/bin/env python3
"""
scorer.py — Score a DSPilot harness candidate against eval_set.jsonl.

For each question, checks:
- expected_regex: simple regex match on the reply
- judge_prompt: LLM-as-judge via claude CLI (haiku, cheap)
- leakage check: ensure the candidate's skill files don't contain the
  expected answer verbatim (cheap anti-cheat)

Writes:
- <candidate>/runs/<qid>/score.json   (per-question)
- <candidate>/score.json              (aggregate)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
JUDGE_MODEL = "claude-haiku-4-5"


def load_jsonl(path: Path) -> list[dict]:
    out = []
    with path.open() as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            out.append(json.loads(line))
    return out


def score_regex(reply: str, pattern: str) -> dict:
    try:
        rx = re.compile(pattern, re.IGNORECASE | re.MULTILINE)
    except re.error as e:
        return {"correct": False, "method": "regex", "error": f"bad pattern: {e}"}
    m = rx.search(reply)
    return {
        "correct": bool(m),
        "method": "regex",
        "pattern": pattern,
        "match": m.group(0) if m else None,
    }


def _judge_via_claude(question: str, reply: str, judge_prompt: str) -> dict:
    """
    Spawn a cheap Haiku call that judges correctness. Returns dict with
    correct: bool, confidence: 0..1, reasoning: str.
    """
    prompt = f"""You are an evaluation judge for a DSPilot Brain reply.

Rubric: {judge_prompt}

Original user question:
{question}

Agent's reply:
{reply}

Output ONE line of JSON only (no prose, no markdown):
{{"correct": true|false, "confidence": 0.0-1.0, "reasoning": "one sentence"}}"""

    env = os.environ.copy()
    env.pop("ANTHROPIC_API_KEY", None)
    try:
        r = subprocess.run(
            [
                "claude",
                "-p",
                prompt,
                "--model",
                JUDGE_MODEL,
                "--output-format",
                "stream-json",
                "--verbose",
                "--dangerously-skip-permissions",
            ],
            env=env,
            capture_output=True,
            text=True,
            timeout=60,
        )
    except subprocess.TimeoutExpired:
        return {"correct": False, "method": "judge", "error": "timeout"}

    text = ""
    for line in r.stdout.splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue
        if ev.get("type") == "result":
            text = ev.get("result", text) or text
        elif ev.get("type") == "assistant":
            for block in ev.get("message", {}).get("content", []) or []:
                if block.get("type") == "text":
                    text += block.get("text", "")

    # Find the JSON object in text
    m = re.search(r"\{[^{}]*\"correct\"[^{}]*\}", text)
    if not m:
        return {"correct": False, "method": "judge", "raw": text[:200], "error": "no JSON"}
    try:
        parsed = json.loads(m.group(0))
        return {
            "correct": bool(parsed.get("correct")),
            "method": "judge",
            "confidence": float(parsed.get("confidence", 0.0)),
            "reasoning": parsed.get("reasoning", ""),
        }
    except json.JSONDecodeError:
        return {"correct": False, "method": "judge", "raw": text[:200], "error": "bad JSON"}


def score_one(question: dict, reply: str) -> dict:
    if "expected_regex" in question and question["expected_regex"]:
        res = score_regex(reply, question["expected_regex"])
        if res.get("correct"):
            return res
        # Fall through to judge if regex fails AND judge_prompt exists.
        if "judge_prompt" not in question:
            return res
    if "judge_prompt" in question:
        return _judge_via_claude(question["q"], reply, question["judge_prompt"])
    return {"correct": False, "method": "none", "error": "no scoring method"}


def check_leakage(candidate_dir: Path, eval_set: list[dict]) -> list[str]:
    """
    Grep the candidate's skills for literal numeric answers. Flags potential
    test-set leakage (harness tuned to memorize expected values).
    """
    skill_texts = []
    for sd in (candidate_dir / "skills",):
        if sd.exists():
            for f in sd.rglob("*.md"):
                skill_texts.append(f.read_text())
    if not skill_texts:
        return []
    corpus = "\n---\n".join(skill_texts)
    leaks: list[str] = []
    for q in eval_set:
        pattern = q.get("expected_regex")
        if not pattern:
            continue
        try:
            rx = re.compile(pattern, re.IGNORECASE)
        except re.error:
            continue
        if rx.search(corpus):
            leaks.append(q["id"])
    return leaks


def aggregate(per_q: dict, metrics_dir: Path) -> dict:
    total = len(per_q)
    correct = sum(1 for v in per_q.values() if v.get("correct"))
    wall_sum = 0.0
    cost_sum = 0.0
    tools_sum = 0
    for qid, _ in per_q.items():
        mp = metrics_dir / qid / "metrics.json"
        if mp.exists():
            try:
                m = json.loads(mp.read_text())
                wall_sum += m.get("wall_seconds", 0) or 0
                cost_sum += m.get("cost_usd", 0) or 0
                tools_sum += m.get("tool_calls_count", 0) or 0
            except Exception:
                pass
    return {
        "n": total,
        "correct": correct,
        "accuracy": round(correct / total, 3) if total else 0.0,
        "mean_wall_s": round(wall_sum / total, 2) if total else 0.0,
        "total_cost_usd": round(cost_sum, 4),
        "mean_tool_calls": round(tools_sum / total, 2) if total else 0.0,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--candidate", required=True)
    p.add_argument("--eval-set", default=str(REPO_ROOT / "eval_set.jsonl"))
    p.add_argument("--only", help="score only this qid")
    p.add_argument("--check-leakage", action="store_true", help="only run leak check")
    args = p.parse_args()

    candidate_dir = Path(args.candidate).resolve()
    eval_set = load_jsonl(Path(args.eval_set))

    if args.check_leakage:
        leaks = check_leakage(candidate_dir, eval_set)
        print(json.dumps({"leaks": leaks, "candidate": candidate_dir.name}, indent=2))
        sys.exit(1 if leaks else 0)

    runs_dir = candidate_dir / "runs"
    if not runs_dir.exists():
        print(f"ERROR: no runs/ in {candidate_dir} — run runner.py first", file=sys.stderr)
        sys.exit(2)

    if args.only:
        eval_set = [q for q in eval_set if q["id"] == args.only]

    per_q: dict = {}
    for q in eval_set:
        qid = q["id"]
        reply_path = runs_dir / qid / "reply.txt"
        if not reply_path.exists():
            per_q[qid] = {"correct": False, "method": "missing", "error": "no reply.txt"}
            continue
        reply = reply_path.read_text()
        t0 = time.time()
        score = score_one(q, reply)
        score["judged_in_s"] = round(time.time() - t0, 2)
        (runs_dir / qid / "score.json").write_text(json.dumps(score, indent=2))
        per_q[qid] = score
        tag = "OK" if score.get("correct") else "FAIL"
        print(f"  [{tag}] {qid} via {score.get('method')}")

    agg = aggregate(per_q, runs_dir)
    leaks = check_leakage(candidate_dir, eval_set)
    agg["leaks"] = leaks
    (candidate_dir / "score.json").write_text(
        json.dumps({"aggregate": agg, "per_question": per_q}, indent=2)
    )
    print(f"\nAccuracy: {agg['accuracy']:.1%} ({agg['correct']}/{agg['n']})  "
          f"mean {agg['mean_wall_s']}s  ${agg['total_cost_usd']:.4f}  "
          f"leaks={len(leaks)}")


if __name__ == "__main__":
    main()
