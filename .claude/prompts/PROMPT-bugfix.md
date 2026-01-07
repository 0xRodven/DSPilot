# Bug Fix Task

## BUG DESCRIPTION
$BUG_DESCRIPTION

## REPRODUCTION STEPS
$REPRO_STEPS

## EXPECTED BEHAVIOR
$EXPECTED_BEHAVIOR

## CONSTRAINTS

### Approach
- Make minimal changes to fix the issue
- Don't introduce new dependencies
- Don't refactor unrelated code
- Add defensive checks only where needed

### Quality
- Follow existing error handling patterns
- Don't weaken tests to pass buggy code
- Ensure no regression in related features

## SUCCESS CRITERIA

All criteria must pass before completion:

- [ ] Bug is fixed (no longer reproducible)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] No new bugs introduced

## PROCESS

1. **Reproduce**: Confirm the bug exists (max 5 min)
2. **Locate**: Find root cause in code (max 10 min)
3. **Fix**: Apply minimal fix
4. **Verify**: Run all checks

## COMPLETION SIGNAL

When bug is fixed and all checks pass, output:
```
TASK_COMPLETE: Bug fixed - [brief description of the fix]
```

If cannot reproduce the bug, output:
```
TASK_BLOCKED: Cannot reproduce bug - need more information
```

If root cause found but fix unclear, output:
```
TASK_BLOCKED: Root cause at [file:line] - [description] - need guidance on fix approach
```

## COMMON PATTERNS

### Null check missing
```typescript
// Before
data.property

// After
if (!data) return null
data.property
```

### Async error handling
```typescript
try {
  await mutation()
} catch (error) {
  console.error("Failed:", error)
  toast.error("Operation failed")
}
```

### Type narrowing
```typescript
if (value === undefined) return
// value is now defined
```
