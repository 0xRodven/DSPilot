---
name: next-components
description: Build React 19 components with Next.js 16 App Router, shadcn/ui, and Tailwind CSS. Use when creating UI components, pages, or layouts for DSPilot.
allowed-tools: Read, Write, Edit, Bash
---

# Next.js + React 19 Component Patterns for DSPilot

## When to Use
- Creating new pages or layouts
- Building dashboard components
- Implementing forms and modals
- Adding interactive UI elements

## Tech Stack
- Next.js 16 (App Router)
- React 19
- shadcn/ui components
- Tailwind CSS
- Convex for data
- Zustand for client state

## Instructions

### 1. Server vs Client Components

**Server Components (default)** - Use for:
- Pages that fetch data
- Static layouts
- SEO-critical content

**Client Components** - Use for:
- Interactive elements
- Convex hooks (useQuery, useMutation)
- Browser APIs
- Event handlers

```tsx
// Server Component (no directive needed)
export default async function Page() {
  return <div>Static content</div>;
}

// Client Component
"use client";

import { useQuery } from "convex/react";

export function InteractiveComponent() {
  const data = useQuery(api.data.get);
  return <div onClick={() => {}}>{data}</div>;
}
```

### 2. Data Fetching with Convex

```tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useDashboardStore } from "@/lib/store";

export function DataComponent() {
  const { selectedStation } = useDashboardStore();

  // Conditional query with "skip"
  const data = useQuery(
    api.stats.getWeeklyStats,
    selectedStation ? { stationId: selectedStation._id } : "skip"
  );

  // Loading state
  if (data === undefined) {
    return <Skeleton className="h-32 w-full" />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-muted-foreground">
        <Database className="h-8 w-8 mb-2" />
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  // Render data
  return <DataDisplay data={data} />;
}
```

### 3. Card Component Pattern

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardProps {
  title: string;
  value: number | undefined;
  description?: string;
  trend?: number;
}

export function KPICard({ title, value, description, trend }: KPICardProps) {
  if (value === undefined) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toFixed(1)}%</div>
        {trend !== undefined && (
          <p className={cn(
            "text-xs",
            trend >= 0 ? "text-emerald-500" : "text-red-500"
          )}>
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}% vs semaine précédente
          </p>
        )}
        {description && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
```

### 4. Table Component Pattern

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Driver {
  _id: Id<"drivers">;
  name: string;
  dwcScore: number;
  tier: string;
}

export function DriversTable({ drivers }: { drivers: Driver[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead className="text-right">DWC%</TableHead>
            <TableHead>Tier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver) => (
            <TableRow key={driver._id}>
              <TableCell className="font-medium">{driver.name}</TableCell>
              <TableCell className="text-right">
                {driver.dwcScore.toFixed(1)}%
              </TableCell>
              <TableCell>
                <Badge className={getTierBgColor(driver.tier)}>
                  {driver.tier}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 5. Form with React Hook Form

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
});

type FormData = z.infer<typeof schema>;

export function CreateForm() {
  const create = useMutation(api.items.create);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await create(data);
      toast.success("Créé avec succès");
      form.reset();
    } catch (error) {
      toast.error("Erreur lors de la création");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Création..." : "Créer"}
        </Button>
      </form>
    </Form>
  );
}
```

### 6. Modal/Dialog Pattern

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ActionModal() {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    toast.success("Action réussie");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Ouvrir</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Titre</DialogTitle>
          <DialogDescription>
            Description de l'action
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* Content */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 7. Tier Colors (DSPilot Specific)

```tsx
import { getTier, getTierColor, getTierBgColor } from "@/lib/utils/tier";

// Get tier from DWC percentage
const tier = getTier(dwcPercent); // "fantastic" | "great" | "fair" | "poor"

// Text color
const textColor = getTierColor(tier); // "text-emerald-400"

// Badge background
const bgColor = getTierBgColor(tier); // "bg-emerald-500/20 text-emerald-400"

// Thresholds:
// fantastic: >= 95%
// great: >= 90%
// fair: >= 88%
// poor: < 88%
```

### 8. Page Layout Pattern

```tsx
// src/app/(app)/dashboard/page.tsx
import { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard | DSPilot",
};

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          {/* Actions */}
        </div>
      </div>
      <DashboardContent />
    </div>
  );
}
```

## Utility: cn() for class merging

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)} />
```

## Important Rules
- Always use `"use client"` for components with hooks
- Use `Skeleton` for loading states, not spinners
- Use `toast` from sonner for notifications
- Never use inline styles - Tailwind only
- Keep components focused and composable
