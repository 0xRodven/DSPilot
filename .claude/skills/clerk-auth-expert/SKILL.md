---
name: clerk-auth-expert
description: Expert guidance on Clerk authentication for multi-tenant SaaS - organizations, roles, webhooks, custom claims, and DSPilot-specific auth patterns.
allowed-tools: Read, Write, Edit, Bash
---

# Clerk Auth Expert Skill

## When to Use
- Setting up authentication flows
- Implementing organization-based multi-tenancy
- Configuring role-based access control
- Handling Clerk webhooks
- Debugging auth issues

## Clerk + Next.js 16 Setup

### Middleware Configuration

```tsx
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
```

### Providers Setup

```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

## Authentication Patterns

### Server Component Auth

```tsx
// app/(main)/dashboard/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { userId, orgId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  // Get full user object if needed
  const user = await currentUser()

  return (
    <div>
      <h1>Welcome, {user?.firstName}</h1>
      {orgId && <p>Organization: {orgId}</p>}
    </div>
  )
}
```

### Client Component Auth

```tsx
// components/user-menu.tsx
"use client"

import { useUser, useOrganization, SignOutButton } from "@clerk/nextjs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserMenu() {
  const { user, isLoaded } = useUser()
  const { organization } = useOrganization()

  if (!isLoaded) {
    return <Skeleton className="h-8 w-8 rounded-full" />
  }

  if (!user) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.imageUrl} />
          <AvatarFallback>
            {user.firstName?.[0]}{user.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          {user.fullName}
          {organization && (
            <span className="text-muted-foreground">
              @ {organization.name}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SignOutButton />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### API Route Auth

```tsx
// app/api/protected/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  const { userId, orgId } = await auth()

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  // Proceed with authenticated request
  return NextResponse.json({ userId, orgId })
}
```

## Organizations (Multi-Tenancy)

### Organization Switcher

```tsx
// components/org-switcher.tsx
"use client"

import { OrganizationSwitcher } from "@clerk/nextjs"

export function OrgSwitcher() {
  return (
    <OrganizationSwitcher
      appearance={{
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger: "w-full justify-start px-2 py-1.5",
        },
      }}
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
      afterSelectPersonalUrl="/dashboard"
      hidePersonal={false}
    />
  )
}
```

### Organization-Scoped Data

```tsx
// In Convex mutation/query
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { getAuthUserId, getOrgId } from "./auth"

export const getStationData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    const orgId = await getOrgId(ctx)

    if (!userId) throw new Error("Unauthorized")

    // Filter by organization
    return await ctx.db
      .query("stations")
      .withIndex("by_org", (q) => q.eq("orgId", orgId))
      .collect()
  },
})

export const createStation = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx)
    const orgId = await getOrgId(ctx)

    if (!userId) throw new Error("Unauthorized")

    // Automatically scope to organization
    return await ctx.db.insert("stations", {
      code: args.code,
      orgId: orgId ?? userId, // Personal or org
      createdBy: userId,
    })
  },
})
```

### Check Organization Membership

```tsx
// In server component or API
import { auth } from "@clerk/nextjs/server"

export async function checkMembership() {
  const { orgId, orgRole, orgSlug } = await auth()

  if (!orgId) {
    // User is in personal workspace
    return { type: "personal" }
  }

  return {
    type: "organization",
    orgId,
    role: orgRole, // "org:admin" | "org:member" | custom
    slug: orgSlug,
  }
}
```

## Role-Based Access Control

### Define Roles in Clerk Dashboard

```markdown
## Organization Roles
- org:admin - Full access
- org:manager - Can manage drivers, view reports
- org:member - Read-only access

## Custom Permissions (in Clerk Dashboard)
- stations:read
- stations:write
- drivers:read
- drivers:write
- coaching:read
- coaching:write
- settings:manage
```

### Check Permissions

```tsx
// Server-side
import { auth } from "@clerk/nextjs/server"

export async function canManageStation() {
  const { has } = await auth()

  // Check role
  const isAdmin = await has({ role: "org:admin" })

  // Or check specific permission
  const canWrite = await has({ permission: "stations:write" })

  return isAdmin || canWrite
}
```

```tsx
// Client-side
"use client"

import { useAuth } from "@clerk/nextjs"

export function SettingsButton() {
  const { has } = useAuth()

  // Check if user can access settings
  if (!has?.({ role: "org:admin" })) {
    return null
  }

  return <Button>Settings</Button>
}
```

### Protect Routes by Role

```tsx
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isAdminRoute = createRouteMatcher(["/dashboard/settings(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { has } = await auth()
    const isAdmin = await has({ role: "org:admin" })

    if (!isAdmin) {
      // Redirect to dashboard if not admin
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }
})
```

## Webhooks

### Webhook Handler

```tsx
// app/api/webhooks/clerk/route.ts
import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET")
  }

  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error("Webhook verification failed:", err)
    return new Response("Invalid signature", { status: 400 })
  }

  // Handle events
  const eventType = evt.type

  switch (eventType) {
    case "user.created":
      await convex.mutation(api.users.createUser, {
        clerkId: evt.data.id,
        email: evt.data.email_addresses[0]?.email_address,
        name: `${evt.data.first_name} ${evt.data.last_name}`.trim(),
        imageUrl: evt.data.image_url,
      })
      break

    case "user.updated":
      await convex.mutation(api.users.updateUser, {
        clerkId: evt.data.id,
        email: evt.data.email_addresses[0]?.email_address,
        name: `${evt.data.first_name} ${evt.data.last_name}`.trim(),
        imageUrl: evt.data.image_url,
      })
      break

    case "user.deleted":
      if (evt.data.id) {
        await convex.mutation(api.users.deleteUser, {
          clerkId: evt.data.id,
        })
      }
      break

    case "organization.created":
      await convex.mutation(api.organizations.create, {
        clerkOrgId: evt.data.id,
        name: evt.data.name,
        slug: evt.data.slug,
      })
      break

    case "organizationMembership.created":
      await convex.mutation(api.organizations.addMember, {
        clerkOrgId: evt.data.organization.id,
        clerkUserId: evt.data.public_user_data.user_id,
        role: evt.data.role,
      })
      break
  }

  return new Response("OK", { status: 200 })
}
```

## Custom Claims (JWT)

### Add Custom Claims

```typescript
// In Clerk Dashboard → Sessions → Customize session token

{
  "stationId": "{{user.public_metadata.stationId}}",
  "plan": "{{user.public_metadata.plan}}",
  "orgRole": "{{org.role}}"
}
```

### Access Custom Claims

```tsx
// Server-side
import { auth } from "@clerk/nextjs/server"

export async function getStationId() {
  const { sessionClaims } = await auth()
  return sessionClaims?.stationId as string | undefined
}
```

```tsx
// Client-side
"use client"

import { useAuth } from "@clerk/nextjs"

export function useStationId() {
  const { sessionClaims } = useAuth()
  return sessionClaims?.stationId as string | undefined
}
```

### Update User Metadata

```tsx
// Server Action to update metadata
"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"

export async function setUserStation(stationId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const client = await clerkClient()

  await client.users.updateUser(userId, {
    publicMetadata: {
      stationId,
    },
  })
}
```

## DSPilot Auth Patterns

### Station-Scoped Access

```tsx
// components/station-guard.tsx
"use client"

import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

export function StationGuard({
  children,
  stationId,
}: {
  children: React.ReactNode
  stationId: string
}) {
  const { userId, orgId } = useAuth()

  const hasAccess = useQuery(
    api.stations.checkAccess,
    userId ? { stationId } : "skip"
  )

  if (hasAccess === undefined) {
    return <LoadingSpinner />
  }

  if (!hasAccess) {
    return <AccessDenied />
  }

  return <>{children}</>
}
```

### Auth Helper for Convex

```tsx
// convex/auth.ts
import { QueryCtx, MutationCtx } from "./_generated/server"

export async function getAuthUserId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? null
}

export async function getOrgId(
  ctx: QueryCtx | MutationCtx
): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  // orgId is in the JWT if user is in an organization
  return (identity?.org_id as string) ?? null
}

export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<string> {
  const userId = await getAuthUserId(ctx)
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}
```

## Common Issues & Fixes

### 1. Middleware Not Running

```tsx
// ❌ Wrong: Forgetting to export config
export default clerkMiddleware(...)

// ✅ Fix: Always export matcher config
export default clerkMiddleware(...)

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}
```

### 2. Session Not Available

```tsx
// ❌ Wrong: Accessing auth before ClerkProvider
function App() {
  const { userId } = useAuth() // Error!
  return <ClerkProvider>...</ClerkProvider>
}

// ✅ Fix: Use inside ClerkProvider
function App() {
  return (
    <ClerkProvider>
      <AuthenticatedContent />
    </ClerkProvider>
  )
}
```

### 3. Webhook Verification Failing

```tsx
// Check these common issues:
// 1. Wrong webhook secret
// 2. Body already consumed (use req.json() only once)
// 3. Headers not passed correctly
// 4. Webhook URL not using HTTPS in production
```

## DO NOT
- Store sensitive data in `publicMetadata` (use `privateMetadata`)
- Forget to verify webhooks in production
- Use `useUser()` in Server Components (use `currentUser()`)
- Skip middleware for protected routes
- Hardcode role names (use constants)
