---
name: tailwind-expert
description: Expert guidance on Tailwind CSS v4 with modern features like @theme directive, container queries, OKLCH colors, and DSPilot-specific patterns.
allowed-tools: Read, Write, Edit
---

# Tailwind CSS Expert Skill

## When to Use
- Implementing complex layouts
- Setting up design systems
- Dark mode implementation
- Responsive design patterns
- Animation and transitions

## Tailwind v4 Features

### @theme Directive
```css
/* tailwind.css */
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: oklch(59% 0.2 255);
  --color-primary-foreground: oklch(98% 0 0);

  /* DSPilot Tier Colors */
  --color-tier-fantastic: oklch(72% 0.19 160);
  --color-tier-great: oklch(62% 0.21 255);
  --color-tier-fair: oklch(79% 0.17 85);
  --color-tier-poor: oklch(62% 0.25 25);

  /* Spacing */
  --spacing-card: 1.5rem;
  --spacing-section: 2rem;

  /* Radii */
  --radius-card: 0.75rem;
  --radius-button: 0.5rem;

  /* Shadows */
  --shadow-card: 0 1px 3px oklch(0% 0 0 / 0.1);
}
```

### Container Queries
```tsx
// Parent must have @container
<div className="@container">
  <div className="@md:flex @md:gap-4">
    {/* Responds to container width, not viewport */}
    <Card className="@md:w-1/2" />
    <Card className="@md:w-1/2" />
  </div>
</div>
```

### OKLCH Color System
```css
/* More perceptually uniform than HSL */
/* Format: oklch(lightness chroma hue / alpha) */

/* Brand colors */
--blue: oklch(59% 0.2 255);
--blue-light: oklch(75% 0.15 255);
--blue-dark: oklch(45% 0.25 255);

/* Generate tints/shades by adjusting lightness */
```

## DSPilot Design System

### Color Variables
```css
:root {
  /* Base */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;

  /* Card */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;

  /* Muted */
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;

  /* Primary */
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;

  /* Tier Colors */
  --tier-fantastic: 160 84% 39%;
  --tier-great: 217 91% 60%;
  --tier-fair: 45 93% 47%;
  --tier-poor: 0 84% 60%;
}

.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  /* ... dark variants */
}
```

### Typography Scale
```tsx
// Display
<h1 className="text-4xl font-bold tracking-tight">Display Large</h1>
<h2 className="text-3xl font-bold tracking-tight">Display Medium</h2>

// Headings
<h2 className="text-2xl font-semibold">Heading Large</h2>
<h3 className="text-xl font-semibold">Heading Medium</h3>
<h4 className="text-lg font-semibold">Heading Small</h4>

// Body
<p className="text-base leading-relaxed">Body Large</p>
<p className="text-sm leading-relaxed">Body Medium</p>
<p className="text-xs leading-relaxed">Body Small</p>

// Labels
<span className="text-sm font-medium">Label Large</span>
<span className="text-xs font-medium">Label Medium</span>
```

### Spacing Scale
```tsx
// Consistent spacing
<div className="p-4">       {/* 16px - standard */}
<div className="p-6">       {/* 24px - cards */}
<div className="gap-4">     {/* 16px - between items */}
<div className="space-y-4"> {/* 16px - vertical stack */}
<div className="my-8">      {/* 32px - section margins */}
```

## Layout Patterns

### Dashboard Grid
```tsx
// Responsive KPI cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <KPICard />
  <KPICard />
  <KPICard />
  <KPICard />
</div>

// Sidebar + Content
<div className="flex min-h-screen">
  <aside className="hidden md:flex w-64 flex-col border-r">
    <Sidebar />
  </aside>
  <main className="flex-1 p-6">
    <Content />
  </main>
</div>
```

### Card Patterns
```tsx
// Standard card
<Card className="p-6">
  <CardHeader className="pb-4">
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// Card with colored border
<Card className="border-l-4 border-l-emerald-500">
  {/* fantastic tier card */}
</Card>

// Hover card
<Card className="transition-shadow hover:shadow-md">
  {/* interactive card */}
</Card>
```

### Table Patterns
```tsx
// Responsive table with horizontal scroll
<div className="overflow-x-auto rounded-md border">
  <Table>
    <TableHeader>
      <TableRow className="bg-muted/50">
        <TableHead className="w-[200px]">Name</TableHead>
        <TableHead className="text-right">DWC</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {/* rows */}
    </TableBody>
  </Table>
</div>

// Row with hover
<TableRow className="hover:bg-muted/50 cursor-pointer">
```

## Responsive Patterns

### Breakpoints
```tsx
// Mobile-first approach
<div className="
  w-full          // Mobile: full width
  sm:w-1/2        // 640px+: half width
  md:w-1/3        // 768px+: third width
  lg:w-1/4        // 1024px+: quarter width
  xl:w-1/5        // 1280px+: fifth width
">
```

### Hide/Show
```tsx
// Mobile only
<div className="block md:hidden">
  <MobileNav />
</div>

// Desktop only
<div className="hidden md:block">
  <DesktopNav />
</div>
```

### Responsive Typography
```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
```

## Dark Mode

### Implementation
```tsx
// Automatic (system preference)
<html className="dark">

// Toggle-based
const [theme, setTheme] = useState("light")
<html className={theme}>
```

### Dark Mode Classes
```tsx
// Use CSS variables that auto-switch
<div className="bg-background text-foreground">
  {/* Automatically adapts */}
</div>

// Or explicit dark variants
<div className="bg-white dark:bg-gray-900">
  {/* Manual control */}
</div>
```

## Animation Patterns

### Transitions
```tsx
// Hover transitions
<button className="transition-colors hover:bg-primary/90">

// All properties
<div className="transition-all duration-200">

// Specific properties
<div className="transition-transform hover:scale-105">
```

### Loading States
```tsx
// Skeleton
<Skeleton className="h-8 w-full animate-pulse" />

// Spinner
<div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
```

## cn() Utility

```tsx
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage
<div className={cn(
  "base-classes",
  condition && "conditional-class",
  className // passed as prop
)}>
```

## Common Patterns

### Truncate Text
```tsx
<p className="truncate">Very long text...</p>
<p className="line-clamp-2">Two lines max...</p>
```

### Aspect Ratio
```tsx
<div className="aspect-video">
  <img className="object-cover w-full h-full" />
</div>
```

### Backdrop Blur
```tsx
<div className="backdrop-blur-sm bg-white/80">
  {/* Frosted glass effect */}
</div>
```

### Focus Rings
```tsx
<button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
```

## DO NOT
- Use arbitrary values like `p-[17px]` (use scale)
- Mix inline styles with Tailwind
- Create CSS files for one-off styles
- Forget dark mode variants
- Ignore responsive breakpoints
- Use `!important` (use specificity)
