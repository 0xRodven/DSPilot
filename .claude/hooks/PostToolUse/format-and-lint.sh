#!/bin/bash
# PostToolUse Hook: Auto-format and lint after file edits
#
# Triggered after: Edit, Write tools
# Exit codes:
#   0 = Success (continue)
#   1 = Warning (show message, continue)
#   2 = Block (stop execution)
#
# Environment variables available:
#   CLAUDE_TOOL_NAME - Name of the tool that was used
#   CLAUDE_TOOL_ARG_FILE_PATH - File path argument (for Edit/Write)
#   CLAUDE_PROJECT_DIR - Project root directory

set -e

# Only process TypeScript/TSX files
FILE_PATH="${CLAUDE_TOOL_ARG_FILE_PATH:-}"

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Check file extension
if [[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  exit 0
fi

# Only run for Edit or Write tools
if [[ "$CLAUDE_TOOL_NAME" != "Edit" && "$CLAUDE_TOOL_NAME" != "Write" ]]; then
  exit 0
fi

# Change to project directory
cd "${CLAUDE_PROJECT_DIR:-/Users/ousmane/Desktop/DSPilot}"

# Check if file exists
if [[ ! -f "$FILE_PATH" ]]; then
  exit 0
fi

# Run ESLint fix silently
npx eslint --fix "$FILE_PATH" 2>/dev/null || true

# Check for remaining lint errors
LINT_OUTPUT=$(npx eslint "$FILE_PATH" 2>&1) || true
LINT_EXIT=$?

if [[ $LINT_EXIT -ne 0 ]]; then
  echo "Lint warnings in $FILE_PATH:"
  echo "$LINT_OUTPUT" | head -10
  exit 1  # Warning, don't block
fi

exit 0
