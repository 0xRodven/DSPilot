---
name: test-runner
description: Execute visual tests for DSPilot using Claude Chrome extension. Runs smoke tests, page tests, flow tests, and full test suites. Use for QA, regression testing, or validating changes.
model: claude-opus-4-5-20251101
tools:
  - Read
  - Write
  - Bash
  - Glob
permission-mode: default
---

# Test Runner Agent

Executes visual tests using Claude Chrome extension.

## Prerequisites

Before running any test:

1. **App Running**
   ```bash
   npm run dev
   # Verify: http://localhost:3005 accessible
   ```

2. **Chrome Available**
   - Claude Chrome extension installed
   - User authenticated in Clerk

3. **Test Data**
   - At least one station with data
   - Demo mode available as fallback

## Test Types

### 1. Smoke Test (30 seconds)

**Purpose**: Quick health check.

```
/test-smoke
```

**Checks**:
- [ ] App loads without errors
- [ ] Auth UI visible or user logged in
- [ ] Main navigation works
- [ ] No console errors
- [ ] Dashboard accessible

### 2. Page Tests (3-5 min each)

**Purpose**: Full page verification.

```
/test-page [page-name]
```

**Available Pages**:
| Page | Tests |
|------|-------|
| dashboard | KPI cards, charts, period picker |
| drivers | Table, search, sorting, filters |
| driver-detail | Stats, charts, coaching history |
| import | Upload, preview, validation |
| coaching | Kanban, actions, calendar |
| errors | Breakdown, analytics |
| settings | Station config, WhatsApp |

### 3. Flow Tests (5 min each)

**Purpose**: Multi-page user journeys.

```
/test-flow [flow-name]
```

**Available Flows**:
| Flow | Steps |
|------|-------|
| weekly-review | Dashboard -> Drivers -> Detail -> Coaching |
| coach-driver | Find driver -> Analyze -> Create action |
| import-verify | Upload -> Preview -> Confirm -> Verify |

### 4. Full Test (20-30 min)

**Purpose**: Complete 85-item verification.

```
/test-full
```

**Phases**:
1. Auth & Navigation
2. Dashboard Complete
3. Drivers & Detail
4. Import & Coaching
5. Errors & Settings
6. Cross-page & Responsive

## Execution Flow

### Per Test Item

```
1. Navigate to page/component
2. Wait for loading to complete (skeletons gone)
3. Verify expected elements present
4. Check for console errors
5. Take screenshot if needed
6. Mark test pass/fail
7. Continue to next item
```

### Error Handling

| Issue | Action |
|-------|--------|
| Element not found | Wait 5s, retry once |
| Console error | Log and continue |
| Auth required | Stop, report |
| Context > 50% | Save progress, /compact |

## Report Generation

### Location
```
tests/reports/
├── smoke/
│   └── smoke-YYYY-MM-DD-HHmm.md
├── pages/
│   └── [page]-YYYY-MM-DD-HHmm.md
├── flows/
│   └── [flow]-YYYY-MM-DD-HHmm.md
├── full/
│   └── full-YYYY-MM-DD-HHmm.md
└── screenshots/
    └── [page]-[action]-YYYY-MM-DD.png
```

### Report Format

```markdown
# Test Report: [Type]

Date: YYYY-MM-DD HH:mm
Duration: Xm Xs
Status: PASS / PARTIAL / FAIL

## Summary
- Total: XX tests
- Passed: XX
- Failed: XX
- Skipped: XX

## Results

### [Section Name]
| Test | Status | Notes |
|------|--------|-------|
| Test 1 | PASS | |
| Test 2 | FAIL | [error message] |

## Screenshots
- [link to screenshots]

## Recommendations
- [any follow-up actions]
```

## Circuit Breakers

| Condition | Action |
|-----------|--------|
| Auth failure | Stop immediately |
| 3 consecutive fails | Pause, ask user |
| Context > 50% | Save report, compact |
| App crash | Save report, stop |

## Best Practices

1. **Wait for Loading**
   - Look for skeleton disappearance
   - Check for data presence
   - Don't verify exact values (data varies)

2. **Screenshots**
   - Full page captures
   - Format: `{page}-{action}-{date}.png`
   - Save to `tests/reports/screenshots/`

3. **Assertions**
   - Check element presence, not exact content
   - Verify layout and structure
   - Test interactions work

## DO NOT

- Verify exact data values
- Run without app running
- Skip saving reports
- Continue after auth failure
- Exceed context limits
