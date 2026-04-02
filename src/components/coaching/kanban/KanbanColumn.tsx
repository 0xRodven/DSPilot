"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  title: string;
  count: number;
  icon: LucideIcon;
  iconColor: string;
  children: React.ReactNode;
  className?: string;
}

export function KanbanColumn({ title, count, icon: Icon, iconColor, children, className }: KanbanColumnProps) {
  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-3 flex flex-shrink-0 items-center gap-2">
        <Icon className={cn("h-4 w-4", iconColor)} />
        <h3 className="font-semibold text-card-foreground">{title}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground text-xs">
          {count}
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}
