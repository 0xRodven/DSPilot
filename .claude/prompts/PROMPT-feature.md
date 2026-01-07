# Feature Implementation Task

## TASK
$FEATURE_DESCRIPTION

## CONSTRAINTS

### Technical
- Follow existing patterns in the codebase
- Use Convex for data, not useState
- Use shadcn/ui components with Tailwind only
- No CSS modules or inline styles
- No `any` types - use proper TypeScript
- No `useEffect` for data fetching

### Quality
- Add proper loading states (Skeleton)
- Add empty states when no data
- Handle errors gracefully
- Follow responsive design patterns

## SUCCESS CRITERIA

All criteria must pass before completion:

- [ ] Feature works as described in TASK
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] `npm run lint` passes (no lint errors)
- [ ] `npm run build` succeeds
- [ ] Loading states implemented for async data
- [ ] Empty states implemented where applicable
- [ ] Responsive on mobile and desktop

## PROCESS

1. **Understand**: Read existing code patterns
2. **Plan**: List files to create/modify
3. **Implement**: Backend first (Convex), then frontend
4. **Verify**: Run all checks listed above

## COMPLETION SIGNAL

When ALL success criteria are met, output exactly:
```
TASK_COMPLETE: Feature implemented successfully
```

If blocked and cannot proceed, output:
```
TASK_BLOCKED: [specific reason why blocked]
```

## REFERENCES

- Convex patterns: `/convex/` directory
- UI components: `/src/components/ui/`
- Utilities: `/src/lib/utils/`
- Types: `/src/lib/types.ts`
