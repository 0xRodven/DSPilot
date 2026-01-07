---
name: figma-to-code
description: Convert Figma designs to production-ready code. Extract design tokens, generate React components, and ensure pixel-perfect implementation with shadcn/ui mapping.
allowed-tools: Read, Write, Edit, WebFetch
---

# Figma to Code Skill

## When to Use
- Converting Figma mockups to React components
- Extracting design tokens from Figma
- Mapping Figma components to shadcn/ui
- Ensuring design-code consistency

## Design Token Extraction

### Colors
```typescript
// From Figma → CSS Variables
:root {
  /* Primary */
  --primary: 220 70% 50%;          /* Figma: Brand Blue #3B82F6 */
  --primary-foreground: 0 0% 100%;

  /* Semantic */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;

  /* Status (DSPilot Tiers) */
  --tier-fantastic: 160 84% 39%;   /* Emerald #10B981 */
  --tier-great: 217 91% 60%;       /* Blue #3B82F6 */
  --tier-fair: 45 93% 47%;         /* Amber #F59E0B */
  --tier-poor: 0 84% 60%;          /* Red #EF4444 */
}
```

### Typography Scale
```typescript
// Figma Type Scale → Tailwind
const typography = {
  // Display
  "display-lg": "text-4xl font-bold tracking-tight",  // 36px
  "display-md": "text-3xl font-bold tracking-tight",  // 30px

  // Headings
  "heading-lg": "text-2xl font-semibold",             // 24px
  "heading-md": "text-xl font-semibold",              // 20px
  "heading-sm": "text-lg font-semibold",              // 18px

  // Body
  "body-lg": "text-base leading-relaxed",             // 16px
  "body-md": "text-sm leading-relaxed",               // 14px
  "body-sm": "text-xs leading-relaxed",               // 12px

  // Labels
  "label-lg": "text-sm font-medium",
  "label-md": "text-xs font-medium",
}
```

### Spacing Scale
```typescript
// Figma Spacing → Tailwind
const spacing = {
  "space-1": "4px",   // p-1
  "space-2": "8px",   // p-2
  "space-3": "12px",  // p-3
  "space-4": "16px",  // p-4
  "space-5": "20px",  // p-5
  "space-6": "24px",  // p-6
  "space-8": "32px",  // p-8
  "space-10": "40px", // p-10
  "space-12": "48px", // p-12
}
```

## Figma → shadcn/ui Component Mapping

| Figma Component | shadcn/ui Component | Notes |
|-----------------|---------------------|-------|
| Button/Primary | `<Button>` | Default variant |
| Button/Secondary | `<Button variant="secondary">` | |
| Button/Ghost | `<Button variant="ghost">` | |
| Button/Destructive | `<Button variant="destructive">` | |
| Input Field | `<Input>` | Add Label, FormMessage |
| Select/Dropdown | `<Select>` | With SelectTrigger, Content |
| Card | `<Card>` | CardHeader, Content, Footer |
| Modal | `<Dialog>` | DialogTrigger, Content |
| Tabs | `<Tabs>` | TabsList, TabsTrigger, TabsContent |
| Table | `<Table>` | TanStack for data tables |
| Tooltip | `<Tooltip>` | TooltipTrigger, Content |
| Badge | `<Badge>` | Multiple variants |
| Avatar | `<Avatar>` | AvatarImage, Fallback |
| Skeleton | `<Skeleton>` | For loading states |

## Component Generation Process

### 1. Analyze Figma Structure
```markdown
1. Identify component layers
2. Note padding/margins (convert to Tailwind)
3. Extract colors (map to CSS vars)
4. Check typography (map to text-* classes)
5. Note interactions (hover, focus states)
```

### 2. Generate React Component
```tsx
// From Figma: "KPI Card" component
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "stable"
  className?: string
}

export function KPICard({
  title,
  value,
  change,
  trend,
  className
}: KPICardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={cn(
            "text-xs",
            trend === "up" && "text-emerald-500",
            trend === "down" && "text-red-500",
            trend === "stable" && "text-muted-foreground"
          )}>
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
            {change > 0 ? "+" : ""}{change}% from last week
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

### 3. Responsive Implementation
```tsx
// Figma shows desktop → implement mobile-first

// Desktop: 4 columns
// Tablet: 2 columns
// Mobile: 1 column

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <KPICard title="Fleet DWC" value="96.5%" />
  <KPICard title="Active Drivers" value={42} />
  <KPICard title="Coaching Pending" value={8} />
  <KPICard title="Alerts" value={3} />
</div>
```

## Common Figma Patterns → Code

### Card Grid
```tsx
// Figma: Auto-layout with 16px gap
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

### Sidebar Layout
```tsx
// Figma: Fixed sidebar + scrollable content
<div className="flex h-screen">
  <aside className="w-64 border-r shrink-0">
    <Sidebar />
  </aside>
  <main className="flex-1 overflow-auto">
    <Content />
  </main>
</div>
```

### Data Table
```tsx
// Figma: Table with fixed header
<div className="overflow-auto">
  <Table>
    <TableHeader className="sticky top-0 bg-background">
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>DWC</TableHead>
        <TableHead>Tier</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {/* rows */}
    </TableBody>
  </Table>
</div>
```

### Form Layout
```tsx
// Figma: Stacked form with 24px gap
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" />
  </div>
  <Button type="submit">Submit</Button>
</form>
```

## Figma Properties → Tailwind

| Figma Property | Tailwind Class |
|----------------|----------------|
| Fill: #3B82F6 | `bg-blue-500` |
| Opacity: 50% | `opacity-50` or `bg-blue-500/50` |
| Corner Radius: 8px | `rounded-lg` |
| Corner Radius: Full | `rounded-full` |
| Shadow: Elevation 1 | `shadow-sm` |
| Shadow: Elevation 2 | `shadow-md` |
| Blur: 8px | `blur-sm` |
| Border: 1px | `border` |
| Gap: 16px | `gap-4` |
| Padding: 24px | `p-6` |

## DSPilot-Specific Components

### Tier Badge
```tsx
// From Figma tier indicator
import { Badge } from "@/components/ui/badge"
import { getTierBgColor } from "@/lib/utils/tier"

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <Badge className={getTierBgColor(tier)}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </Badge>
  )
}
```

### Driver Row
```tsx
// From Figma driver list item
export function DriverRow({ driver }: { driver: Driver }) {
  const tier = getTier(driver.dwcPercent)

  return (
    <TableRow>
      <TableCell>{driver.name}</TableCell>
      <TableCell className={getTierColor(tier)}>
        {driver.dwcPercent.toFixed(1)}%
      </TableCell>
      <TableCell>
        <TierBadge tier={tier} />
      </TableCell>
    </TableRow>
  )
}
```

## DO NOT
- Guess colors (always extract from Figma)
- Hardcode pixel values (use Tailwind scale)
- Ignore responsive design
- Skip hover/focus states
- Forget dark mode compatibility
