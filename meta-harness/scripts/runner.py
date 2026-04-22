#!/usr/bin/env python3
"""
runner.py — Execute a single DSPilot eval question against a harness candidate.

Approach (v2, portable Mac + Linux) :
  - We do NOT override $HOME (would break macOS Keychain auth)
  - We compose the harness content (CLAUDE.md + skills/*.md) into one
    `--append-system-prompt` string
  - We isolate from the user's local Claude setup via `--setting-sources ""`
    and an empty plugin dir
  - We call `claude -p <question> --model <m> --output-format stream-json`
    and capture stdout / stderr / wall time / tokens

This keeps the eval reproducible while working on any machine where the
`claude` CLI is already logged in.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
EMPTY_PLUGIN_DIR = REPO_ROOT / "scripts" / ".empty_plugins"
DEFAULT_MODEL = "claude-opus-4-7"
DEFAULT_TIMEOUT = 180


def load_jsonl(path: Path) -> list[dict]:
    out = []
    with path.open() as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            out.append(json.loads(line))
    return out


def compose_harness_prompt(candidate_dir: Path) -> str:
    """
    Read CLAUDE.md + all skills/*.md from the candidate and concatenate into
    one system-prompt addendum. This is what the agent "sees" as its harness.
    """
    parts: list[str] = []

    for root_file in ("CLAUDE.md",):
        p = candidate_dir / root_file
        if p.exists():
            parts.append(f"# {root_file}\n\n{p.read_text().strip()}")

    skills_dir = candidate_dir / "skills"
    if skills_dir.exists():
        for md in sorted(skills_dir.glob("*.md")):
            parts.append(f"# skill: {md.stem}\n\n{md.read_text().strip()}")

    # Rules — if present (not in current baseline but future-proof)
    rules_dir = candidate_dir / "rules"
    if rules_dir.exists():
        for md in sorted(rules_dir.glob("*.md")):
            parts.append(f"# rule: {md.stem}\n\n{md.read_text().strip()}")

    return "\n\n---\n\n".join(parts)


def build_runner_prompt(question: str, template_path: Path | None) -> str:
    if template_path and template_path.exists():
        tmpl = template_path.read_text()
        return tmpl.replace("{{QUESTION}}", question)
    return question


def spawn_claude(
    prompt: str,
    system_addendum: str,
    model: str,
    add_dir: str | None,
    timeout: int,
    allowed_tools: list[str] | None,
) -> tuple[int, str, str, float]:
    """
    Invoke claude CLI in non-interactive mode.
    Returns (exit_code, stdout, stderr, wall_seconds).
    """
    EMPTY_PLUGIN_DIR.mkdir(parents=True, exist_ok=True)

    cmd = [
        "claude",
        "-p",
        prompt,
        "--model",
        model,
        "--output-format",
        "stream-json",
        "--verbose",
        "--dangerously-skip-permissions",
        "--append-system-prompt",
        system_addendum,
        "--setting-sources",
        "",
        "--strict-mcp-config",
        "--disable-slash-commands",
    ]
    if add_dir:
        cmd.extend(["--add-dir", add_dir])
    if allowed_tools:
        cmd.append("--allowedTools")
        cmd.extend(allowed_tools)

    env = os.environ.copy()
    env.pop("ANTHROPIC_API_KEY", None)

    t0 = time.time()
    try:
        r = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return r.returncode, r.stdout, r.stderr, time.time() - t0
    except subprocess.TimeoutExpired as e:
        out = e.stdout or b""
        if isinstance(out, bytes):
            out = out.decode("utf-8", errors="replace")
        return 124, out, f"Timeout after {timeout}s", time.time() - t0


def parse_stream_json(stdout) -> dict:
    if isinstance(stdout, bytes):
        stdout = stdout.decode("utf-8", errors="replace")
    if stdout is None:
        stdout = ""
    reply_text = ""
    tool_calls: list[dict] = []
    usage = {"input_tokens": 0, "output_tokens": 0, "cache_read_input_tokens": 0}
    cost_usd = 0.0
    errors: list[str] = []
    session_id = ""

    for line in stdout.splitlines():
        line = line.strip()
        if not line or not line.startswith("{"):
            continue
        try:
            ev = json.loads(line)
        except json.JSONDecodeError:
            continue

        et = ev.get("type")
        if et == "system" and ev.get("subtype") == "init":
            session_id = ev.get("session_id", session_id)
        elif et == "assistant":
            msg = ev.get("message", {})
            for block in msg.get("content", []) or []:
                if block.get("type") == "text":
                    reply_text += block.get("text", "")
                elif block.get("type") == "tool_use":
                    tool_calls.append(
                        {"name": block.get("name"), "input": block.get("input", {})}
                    )
            u = msg.get("usage", {}) or {}
            for k in usage:
                if u.get(k):
                    usage[k] += u[k]
        elif et == "result":
            reply_text = ev.get("result", reply_text) or reply_text
            cost_usd = float(ev.get("total_cost_usd") or ev.get("cost_usd") or 0)
            u = ev.get("usage", {}) or {}
            for k in usage:
                if u.get(k):
                    usage[k] = u[k]
            if ev.get("is_error"):
                errors.append(ev.get("subtype", "error"))

    return {
        "reply": reply_text.strip(),
        "tool_calls": tool_calls,
        "usage": usage,
        "cost_usd": cost_usd,
        "errors": errors,
        "session_id": session_id,
    }


def run_question(
    candidate_dir: Path,
    question: dict,
    out_dir: Path,
    runner_template: Path | None,
    add_dir: str | None,
    timeout: int,
    model: str,
    allowed_tools: list[str] | None,
) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    qid = question["id"]
    prompt = build_runner_prompt(question["q"], runner_template)
    system_addendum = compose_harness_prompt(candidate_dir)

    (out_dir / "system_addendum.txt").write_text(system_addendum)

    exit_code, stdout, stderr, wall = spawn_claude(
        prompt=prompt,
        system_addendum=system_addendum,
        model=model,
        add_dir=add_dir,
        timeout=timeout,
        allowed_tools=allowed_tools,
    )
    parsed = parse_stream_json(stdout)

    (out_dir / "question.txt").write_text(question["q"])
    (out_dir / "reply.txt").write_text(parsed["reply"])
    (out_dir / "stdout.log").write_text(stdout)
    if stderr:
        (out_dir / "stderr.log").write_text(stderr)

    metrics = {
        "qid": qid,
        "candidate": str(candidate_dir.name),
        "exit_code": exit_code,
        "wall_seconds": round(wall, 2),
        "tool_calls_count": len(parsed["tool_calls"]),
        "tool_calls": [tc["name"] for tc in parsed["tool_calls"]],
        "usage": parsed["usage"],
        "cost_usd": parsed["cost_usd"],
        "errors": parsed["errors"],
        "reply_chars": len(parsed["reply"]),
        "session_id": parsed["session_id"],
    }
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))
    return metrics


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--eval-set", default=str(REPO_ROOT / "eval_set.jsonl"))
    parser.add_argument("--out", default=None)
    parser.add_argument("--only")
    parser.add_argument("--concurrency", type=int, default=1)
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    parser.add_argument("--add-dir", default="/Users/ousmane/Desktop/DSPilot")
    parser.add_argument("--runner-template", default=str(REPO_ROOT / "prompt-templates" / "dspilot-runner.md"))
    parser.add_argument(
        "--allowed-tools",
        nargs="+",
        default=["Bash", "Read", "Glob", "Grep"],
        help="Tools the agent may call during eval",
    )
    args = parser.parse_args()

    candidate_dir = Path(args.candidate).resolve()
    if not candidate_dir.exists():
        print(f"ERROR: candidate {candidate_dir} not found", file=sys.stderr)
        sys.exit(2)

    out_dir = Path(args.out) if args.out else candidate_dir / "runs"
    out_dir.mkdir(parents=True, exist_ok=True)

    eval_set = load_jsonl(Path(args.eval_set))
    if args.only:
        eval_set = [q for q in eval_set if q["id"] == args.only]
        if not eval_set:
            print(f"ERROR: qid {args.only} not in eval set", file=sys.stderr)
            sys.exit(2)

    runner_template = Path(args.runner_template) if args.runner_template else None
    print(f"Running {len(eval_set)} question(s) on {candidate_dir.name} (concurrency={args.concurrency})")

    def _run_one(q):
        q_out = out_dir / q["id"]
        m = run_question(
            candidate_dir=candidate_dir,
            question=q,
            out_dir=q_out,
            runner_template=runner_template,
            add_dir=args.add_dir,
            timeout=args.timeout,
            model=args.model,
            allowed_tools=args.allowed_tools,
        )
        tag = "OK" if m["exit_code"] == 0 else "FAIL"
        preview = (Path(q_out, "reply.txt").read_text()[:80].replace("\n", " ") if (q_out / "reply.txt").exists() else "")
        print(f"  [{tag}] {q['id']}  {m['wall_seconds']}s  tools={m['tool_calls_count']}  ${m['cost_usd']:.4f}  | {preview}")
        return q["id"], m

    results: dict[str, Any] = {}
    if args.concurrency <= 1:
        for q in eval_set:
            qid, m = _run_one(q)
            results[qid] = m
    else:
        with ThreadPoolExecutor(max_workers=args.concurrency) as ex:
            futs = [ex.submit(_run_one, q) for q in eval_set]
            for fut in as_completed(futs):
                qid, m = fut.result()
                results[qid] = m

    (out_dir / "_summary.json").write_text(json.dumps(results, indent=2))
    print(f"\nSummary: {out_dir / '_summary.json'}")


if __name__ == "__main__":
    main()
