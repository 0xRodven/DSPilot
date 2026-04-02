---
name: permissions-rbac
description: Complete Clerk + Convex auth/permissions reference for DSPilot. 1 Org = 1 Station model with RBAC. Use when implementing access control or auth-related features.
allowed-tools: Read, Write, Edit
---

# DSPilot Permissions & RBAC Reference

Source: `/convex/lib/permissions.ts`

## Multi-Tenancy Model

**1 Clerk Organization = 1 Station.** All members of an organization automatically have access to that organization's station. There is no per-table org scoping -- access is controlled at the station level.

- `stations.organizationId` links a station to a Clerk org
- `stations.ownerId` is the Clerk user ID of the creator (legacy fallback)
- Legacy mode (no org): falls back to `ownerId === userId` ownership check

## Clerk Free Plan Limitations

Clerk Free Plan only supports two built-in roles:

| Role | Constant | Permissions |
|---|---|---|
| Owner/Admin | `"org:admin"` | Full access + can invite members |
| Member | `"org:member"` | Full read + write access |

Custom roles like `org:manager` or `org:viewer` are NOT available on the Free Plan. The `stationAccess` table exists in the schema for future granular access but is not actively used in the current permission checks.

## JWT Fields

When a user is inside a Clerk organization, the JWT contains:

| Field | Access in Convex | Description |
|---|---|---|
| `identity.subject` | `identity.subject` | Clerk user ID |
| `org_id` | `(identity as Record<string, unknown>).org_id` | Current org ID (or undefined) |
| `org_role` | `(identity as Record<string, unknown>).org_role` | `"org:admin"` or `"org:member"` (or undefined) |

Note: `org_id` and `org_role` are accessed via type assertion because Convex's identity type does not include Clerk-specific fields.

## Types

```ts
type OrgRole = "org:admin" | "org:member";

type UserContext = {
  userId: string;
  orgId: string | null;
  orgRole: OrgRole | null;
};
```

## All 11 Functions

### 1. getUserContext

```ts
async function getUserContext(
  ctx: QueryCtx | MutationCtx,
  throwIfUnauthenticated?: boolean // default: true
): Promise<UserContext>
```

Extracts `userId`, `orgId`, and `orgRole` from the Clerk JWT. If `throwIfUnauthenticated` is true and user is not authenticated, throws `"Non authentifie"`. If false, returns `{ userId: "", orgId: null, orgRole: null }`.

### 2. canAccessStation

```ts
async function canAccessStation(
  ctx: QueryCtx | MutationCtx,
  stationId: Id<"stations">,
  throwIfUnauthenticated?: boolean // default: false
): Promise<boolean>
```

Returns true if the user can access the station. Logic:
- If no org: checks `station.ownerId === userId` (legacy mode)
- If org: checks `station.organizationId === orgId` (all org members get access)

### 3. canWrite

```ts
async function canWrite(ctx: QueryCtx | MutationCtx): Promise<boolean>
```

Returns true if user can write. On Free Plan, both `org:admin` and `org:member` can write. Legacy mode (no org) also returns true.

### 4. canWriteStation

```ts
async function canWriteStation(
  ctx: QueryCtx | MutationCtx,
  stationId: Id<"stations">
): Promise<boolean>
```

Combines `canAccessStation()` + `canWrite()`. Returns true only if both pass.

### 5. canInvite

```ts
async function canInvite(ctx: QueryCtx | MutationCtx): Promise<boolean>
```

Returns true only for `org:admin`. Members cannot invite. Returns false if no org.

### 6. isOwner

```ts
async function isOwner(ctx: QueryCtx | MutationCtx): Promise<boolean>
```

Returns true if `orgRole === "org:admin"`.

### 7. getAccessibleStations

```ts
async function getAccessibleStations(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"stations">[]>
```

Returns all stations the user can access:
- Legacy (no org): queries `by_owner` index with `ownerId`
- With org: queries `by_organization` index with `orgId`

### 8. checkStationAccess

```ts
async function checkStationAccess(
  ctx: QueryCtx | MutationCtx,
  stationId: Id<"stations">
): Promise<boolean>
```

Safe check for queries. Returns `false` if unauthenticated (never throws). Delegates to `canAccessStation(ctx, stationId, false)`.

### 9. requireStationAccess

```ts
async function requireStationAccess(
  ctx: QueryCtx | MutationCtx,
  stationId: Id<"stations">
): Promise<void>
```

Throws `"Non authentifie"` if not authenticated. Throws `"Acces non autorise a cette station"` if no access.

### 10. requireWriteAccess

```ts
async function requireWriteAccess(
  ctx: MutationCtx,
  stationId: Id<"stations">
): Promise<void>
```

Throws `"Vous n'avez pas les droits pour modifier cette station"` if user cannot write to the station. Combines station access + write permission.

### 11. requireOwner

```ts
async function requireOwner(ctx: MutationCtx): Promise<void>
```

Throws `"Cette action est reservee aux proprietaires"` if `orgRole !== "org:admin"`.

## Patterns

### Queries: use checkStationAccess (returns false, never throws)

```ts
export const getStats = query({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    const hasAccess = await checkStationAccess(ctx, args.stationId);
    if (!hasAccess) return null; // Return empty, don't throw
    // ... fetch data
  },
});
```

### Mutations: use requireWriteAccess (throws on failure)

```ts
export const importData = mutation({
  args: { stationId: v.id("stations"), /* ... */ },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx, args.stationId);
    // ... safe to proceed
  },
});
```

### Owner-only mutations: use requireOwner

```ts
export const deleteStation = mutation({
  args: { stationId: v.id("stations") },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
    await requireStationAccess(ctx, args.stationId);
    // ... safe to delete
  },
});
```

### Frontend: use useOrganization() from Clerk

```tsx
import { useOrganization } from "@clerk/nextjs";

function MyComponent() {
  const { organization, membership } = useOrganization();
  const isAdmin = membership?.role === "org:admin";
  // ...
}
```

## DO NOT

- **Do NOT create a `logAuditEvent()` function.** There is no audit log table in the schema. If audit logging is needed, add the table to the schema first.
- **Do NOT create a `checkPermission()` generic function.** The permission model is simple enough (2 roles) that specialized functions are clearer.
- **Do NOT use custom roles on the Free Plan.** `org:manager` and `org:viewer` will fail in production. Only `org:admin` and `org:member` exist.
- **Do NOT add `organizationId` checks in data queries.** Always go through `stationId` -- the `canAccessStation()` function already verifies org membership.
- **Do NOT throw errors in query handlers** for access control. Use `checkStationAccess()` and return `null` / empty arrays. Throwing in queries causes ugly error states in the UI.
- **Do NOT call `requireWriteAccess` in queries.** It accepts `MutationCtx` for a reason -- queries should use the non-throwing `checkStationAccess()`.
- **Do NOT bypass permissions by reading `stations` directly** without calling `canAccessStation()` or `checkStationAccess()`. Every query/mutation touching station data must verify access.
- **Do NOT use `stationAccess` table for permission checks.** It exists for future use but the current functions do not read from it. The 1 Org = 1 Station model makes it unnecessary on the Free Plan.
