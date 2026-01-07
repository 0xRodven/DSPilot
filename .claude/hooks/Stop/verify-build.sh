#!/bin/bash
# Stop Hook: Verify build passes before completing task
#
# Triggered when: Claude attempts to finish responding
# Exit codes:
#   0 = Allow stop (task can complete)
#   2 = Continue working (feedback to Claude)
#
# Environment variables available:
#   CLAUDE_PROJECT_DIR - Project root directory

set -e

# Change to project directory
cd "${CLAUDE_PROJECT_DIR:-/Users/ousmane/Desktop/DSPilot}"

# Check if there are modified TypeScript files
MODIFIED_TS=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(ts|tsx)$' || true)

# If no TS files modified, allow completion
if [[ -z "$MODIFIED_TS" ]]; then
  exit 0
fi

echo "=== Pre-completion verification ==="
echo "Modified files:"
echo "$MODIFIED_TS"
echo ""

# Run type check
echo "Running TypeScript check..."
TSC_OUTPUT=$(npx tsc --noEmit 2>&1) || true
TSC_EXIT=$?

if [[ $TSC_EXIT -ne 0 ]]; then
  echo ""
  echo "TYPE CHECK FAILED"
  echo "================="
  echo "$TSC_OUTPUT" | head -30
  echo ""
  echo "Please fix TypeScript errors before completing."
  exit 2  # Continue working
fi

echo "TypeScript: OK"

# Run lint check
echo "Running lint check..."
LINT_OUTPUT=$(npm run lint 2>&1) || true
LINT_EXIT=$?

if [[ $LINT_EXIT -ne 0 ]]; then
  echo ""
  echo "LINT CHECK FAILED"
  echo "================="
  echo "$LINT_OUTPUT" | head -30
  echo ""
  echo "Please fix lint errors before completing."
  exit 2  # Continue working
fi

echo "Lint: OK"
echo ""
echo "All checks passed. Task can be completed."
exit 0
