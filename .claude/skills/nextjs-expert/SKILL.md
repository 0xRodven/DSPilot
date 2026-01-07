---
name: nextjs-expert
description: Expert guidance on Next.js 16 App Router, Server Components, Server Actions, streaming, caching, and DSPilot-specific patterns for optimal performance.
allowed-tools: Read, Write, Edit, Bash
---

# Next.js Expert Skill

## When to Use
- Building new pages/routes
- Implementing Server Components
- Setting up Server Actions
- Optimizing performance
- Debugging Next.js issues

## Next.js 16 Key Features

### App Router Structure

```
src/app/
├── layout.tsx          # Root layout (providers, theme)
├── page.tsx            # Home page
├── globals.css         # Global styles
├── (auth)/             # Auth group (shared layout)
│   ├── sign-in/
│   └── sign-up/
├── (main)/             # Main app group
│   ├── layout.tsx      # Dashboard layout (sidebar)
│   └── dashboard/
│       ├── page.tsx    # /dashboard
│       ├── drivers/
│       │   ├── page.tsx        # /dashboard/drivers
│       │   └── [id]/
│       │       └── page.tsx    # /dashboard/drivers/[id]
│       ├── coaching/
│       ├── import/
│       └── settings/
└── api/                # API routes (if needed)
```

### Server Components (Default)

```tsx
// app/dashboard/page.tsx
// This is a Server Component by default

import { auth } from "@clerk/nextjs/server"
import { DashboardContent } from "@/components/dashboard/content"

export default async function DashboardPage() {
  // Can use async/await directly
  const { userId } = await auth()

  // Can access server-only resources
  // But CANNOT use hooks or browser APIs

  return <DashboardContent userId={userId} />
}
```

### Client Components

```tsx
// components/dashboard/content.tsx
"use client" // ← Required for client components

import { useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"

export function DashboardContent({ userId }: { userId: string }) {
  // ✅ Can use hooks
  const [tab, setTab] = useState("overview")

  // ✅ Can use Convex (client-side)
  const data = useQuery(api.stats.getDashboard, { userId })

  // ✅ Can use browser APIs
  useEffect(() => {
    document.title = "Dashboard"
  }, [])

  return (
    // ... interactive UI
  )
}
```

### When to Use Which

```markdown
## Server Components (Default)
✅ Fetch data from database
✅ Access backend resources
✅ Keep sensitive info server-side
✅ Large dependencies (keep off client bundle)
✅ Static/non-interactive content

## Client Components ("use client")
✅ Interactivity (onClick, onChange)
✅ useState, useEffect, useRef
✅ Browser APIs (localStorage, window)
✅ Convex queries/mutations
✅ Third-party client libraries
```

## DSPilot Patterns

### Layout with Providers

```tsx
// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs"
import { ConvexClientProvider } from "@/components/providers/convex-client-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <ConvexClientProvider>
              {children}
              <Toaster />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### Dashboard Layout with Sidebar

```tsx
// app/(main)/layout.tsx
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar className="hidden md:flex w-64 border-r" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Page with Loading State

```tsx
// app/(main)/dashboard/page.tsx
import { Suspense } from "react"
import { DashboardSkeleton } from "@/components/dashboard/skeleton"
import { DashboardContent } from "@/components/dashboard/content"

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
```

### Dynamic Route with Params

```tsx
// app/(main)/dashboard/drivers/[id]/page.tsx
import { DriverDetail } from "@/components/drivers/driver-detail"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DriverPage({ params }: PageProps) {
  const { id } = await params

  return <DriverDetail driverId={id} />
}
```

### Generate Metadata

```tsx
// app/(main)/dashboard/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard | DSPilot",
  description: "Real-time driver performance dashboard",
}

// Or dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  return {
    title: `Driver ${id} | DSPilot`,
  }
}
```

## Server Actions

### Form Submission

```tsx
// app/(main)/settings/page.tsx
"use client"

import { useActionState } from "react"
import { updateSettings } from "./actions"

export default function SettingsPage() {
  const [state, formAction, isPending] = useActionState(
    updateSettings,
    { error: null }
  )

  return (
    <form action={formAction}>
      <input name="stationCode" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
      {state.error && <p className="text-red-500">{state.error}</p>}
    </form>
  )
}
```

```tsx
// app/(main)/settings/actions.ts
"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export async function updateSettings(
  prevState: { error: string | null },
  formData: FormData
) {
  const { userId } = await auth()
  if (!userId) {
    return { error: "Unauthorized" }
  }

  const stationCode = formData.get("stationCode") as string

  // Validate
  if (!stationCode) {
    return { error: "Station code is required" }
  }

  // Update (using Convex HTTP action or direct DB)
  try {
    // await updateStationCode(userId, stationCode)
    revalidatePath("/settings")
    return { error: null }
  } catch {
    return { error: "Failed to update settings" }
  }
}
```

### Mutation with Optimistic Update

```tsx
"use client"

import { useOptimistic } from "react"
import { deleteDriver } from "./actions"

export function DriverList({ drivers }: { drivers: Driver[] }) {
  const [optimisticDrivers, removeOptimistic] = useOptimistic(
    drivers,
    (state, deletedId: string) =>
      state.filter((d) => d.id !== deletedId)
  )

  const handleDelete = async (id: string) => {
    removeOptimistic(id)
    await deleteDriver(id)
  }

  return (
    <ul>
      {optimisticDrivers.map((driver) => (
        <li key={driver.id}>
          {driver.name}
          <button onClick={() => handleDelete(driver.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
```

## Routing Patterns

### Route Groups

```
app/
├── (auth)/          # Group without URL prefix
│   ├── layout.tsx   # Auth-specific layout
│   ├── sign-in/
│   └── sign-up/
├── (main)/          # Main app group
│   ├── layout.tsx   # Dashboard layout
│   └── dashboard/
```

### Parallel Routes

```
app/
├── @modal/          # Parallel route for modals
│   └── (.)drivers/[id]/edit/
│       └── page.tsx
├── layout.tsx       # Renders {children} AND {modal}
└── page.tsx
```

### Intercepting Routes

```tsx
// app/@modal/(.)drivers/[id]/edit/page.tsx
// Intercepts /drivers/[id]/edit as a modal

import { Modal } from "@/components/ui/modal"
import { EditDriverForm } from "@/components/drivers/edit-form"

export default function EditDriverModal({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <Modal>
      <EditDriverForm driverId={id} />
    </Modal>
  )
}
```

### Catch-All Routes

```tsx
// app/[...slug]/page.tsx
// Matches /a, /a/b, /a/b/c, etc.

export default function CatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  // slug = ["a", "b", "c"] for /a/b/c

  return <NotFound />
}
```

## Streaming & Suspense

### Streaming with Loading UI

```tsx
// app/(main)/dashboard/loading.tsx
import { DashboardSkeleton } from "@/components/dashboard/skeleton"

export default function Loading() {
  return <DashboardSkeleton />
}
```

### Partial Streaming

```tsx
// Stream different parts independently
import { Suspense } from "react"

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <Suspense fallback={<KPISkeleton />}>
        <KPICards />
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <TrendChart />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <DriverTable />
      </Suspense>
    </div>
  )
}
```

## Caching & Revalidation

### Static vs Dynamic

```tsx
// Force dynamic rendering
export const dynamic = "force-dynamic"

// Or force static
export const dynamic = "force-static"

// Revalidate every 60 seconds
export const revalidate = 60
```

### On-Demand Revalidation

```tsx
// In a Server Action
import { revalidatePath, revalidateTag } from "next/cache"

export async function createDriver(data: FormData) {
  // ... create driver

  // Revalidate specific path
  revalidatePath("/dashboard/drivers")

  // Or revalidate by tag
  revalidateTag("drivers")
}
```

## Performance Optimization

### Image Optimization

```tsx
import Image from "next/image"

export function DriverAvatar({ src, name }: Props) {
  return (
    <Image
      src={src}
      alt={name}
      width={40}
      height={40}
      className="rounded-full"
      placeholder="blur"
      blurDataURL="/placeholder.png"
    />
  )
}
```

### Font Optimization

```tsx
// app/layout.tsx
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      {/* ... */}
    </html>
  )
}
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

## Common Gotchas

### 1. "use client" Boundaries

```tsx
// ❌ Wrong: Importing server-only code in client component
"use client"
import { db } from "@/lib/db" // Server-only!

// ✅ Right: Pass data as props from server component
// Parent (server):
async function Page() {
  const data = await db.query()
  return <ClientComponent data={data} />
}

// Child (client):
"use client"
function ClientComponent({ data }: { data: Data }) {
  // Use data from props
}
```

### 2. Hydration Mismatch

```tsx
// ❌ Wrong: Different content on server vs client
function Component() {
  return <p>{Date.now()}</p> // Different on each render!
}

// ✅ Right: Use useEffect for client-only values
"use client"
function Component() {
  const [time, setTime] = useState<number | null>(null)

  useEffect(() => {
    setTime(Date.now())
  }, [])

  return <p>{time ?? "Loading..."}</p>
}
```

### 3. Missing "use client"

```tsx
// ❌ Error: Hooks in server component
function Component() {
  const [state, setState] = useState() // Error!
}

// ✅ Fix: Add "use client"
"use client"
function Component() {
  const [state, setState] = useState() // Works
}
```

## DO NOT
- Use `getServerSideProps` or `getStaticProps` (App Router uses different patterns)
- Import server-only code in client components
- Forget `"use client"` for interactive components
- Use `useEffect` for data fetching (use Server Components or Convex)
- Hardcode environment variables (use `process.env`)
- Skip loading states (use Suspense + loading.tsx)
