---
name: convex-enterprise
description: Write Convex mutations with organization isolation, audit logging, and proper validation. Use when implementing any data modification, creating new tables, or writing queries for DSPilot.
allowed-tools: Read, Write, Edit, Bash
---

# Convex Enterprise Patterns for DSPilot

## When to Use
- Creating/updating Convex mutations
- Adding new tables to schema.ts
- Implementing data queries
- Modifying existing database operations

## Instructions

### 1. Organization Isolation (Multi-Tenancy)
Every data table MUST include `organizationId` for proper tenant isolation:

```typescript
// convex/schema.ts
myTable: defineTable({
  organizationId: v.string(),  // REQUIRED
  // ... other fields
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_organization", ["organizationId"])
  .index("by_org_and_date", ["organizationId", "createdAt"]),
```

### 2. Get Organization Context
Always use getUserContext to get the current org:

```typescript
import { getUserContext } from "./lib/permissions";

export const myMutation = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    const { userId, orgId } = await getUserContext(ctx);
    if (!orgId) throw new Error("Organization required");

    // Use orgId for all operations
  },
});
```

### 3. Audit Logging
Log all mutations to auditLog table:

```typescript
import { logAuditEvent } from "./lib/audit";

// After mutation succeeds
await logAuditEvent(ctx, {
  action: "create" | "update" | "delete",
  resource: "tableName",
  resourceId: recordId,
  userId,
  organizationId: orgId,
  details: { /* relevant changes */ },
});
```

### 4. Validators
Always use strict validators:

```typescript
import { v } from "convex/values";

export const createItem = mutation({
  args: {
    name: v.string(),           // Required string
    count: v.number(),          // Required number
    isActive: v.boolean(),      // Required boolean
    tags: v.array(v.string()),  // Array of strings
    metadata: v.optional(v.object({  // Optional nested object
      key: v.string(),
    })),
  },
  // ...
});
```

### 5. Query Patterns
Filter by organization in all queries:

```typescript
export const listItems = query({
  args: {},
  handler: async (ctx) => {
    const { orgId } = await getUserContext(ctx);
    if (!orgId) return [];

    return await ctx.db
      .query("items")
      .withIndex("by_organization", q => q.eq("organizationId", orgId))
      .order("desc")
      .collect();
  },
});
```

### 6. Permission Checks
Check permissions before sensitive operations:

```typescript
import { checkPermission } from "./lib/rbac";

export const deleteItem = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, { id }) => {
    const { userId, orgId } = await getUserContext(ctx);

    // Check permission
    await checkPermission(ctx, userId, orgId, "items:delete");

    // Verify ownership
    const item = await ctx.db.get(id);
    if (item?.organizationId !== orgId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(id);
  },
});
```

## DSPilot-Specific Tables Requiring organizationId

- drivers
- driverDailyStats
- driverWeeklyStats
- coachingActions
- alerts
- imports
- stationWeeklyStats
- whatsappMessages
- chatMessages
- chatThreads

## Code Examples

### Creating a New Driver
```typescript
export const createDriver = mutation({
  args: {
    name: v.string(),
    amazonId: v.string(),
    stationId: v.id("stations"),
  },
  handler: async (ctx, args) => {
    const { userId, orgId } = await getUserContext(ctx);
    if (!orgId) throw new Error("Organization required");

    const now = Date.now();
    const driverId = await ctx.db.insert("drivers", {
      ...args,
      organizationId: orgId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await logAuditEvent(ctx, {
      action: "create",
      resource: "drivers",
      resourceId: driverId,
      userId,
      organizationId: orgId,
      details: { name: args.name, amazonId: args.amazonId },
    });

    return driverId;
  },
});
```

## Error Handling
Always wrap in try-catch for mutations:

```typescript
try {
  // mutation logic
} catch (error) {
  console.error("Mutation failed:", error);
  throw new Error("Failed to complete operation");
}
```

## Notes
- Never use `any` types
- Always validate stationId belongs to current org
- Use `"skip"` pattern in React for conditional queries
- Keep mutations focused - one operation per mutation
