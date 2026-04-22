"use client"

import type { ReactNode } from "react"

interface MagicBadgeProps {
  children: ReactNode
}

export function MagicBadge({ children }: MagicBadgeProps) {
  return (
    <div className="relative inline-flex h-8 overflow-hidden rounded-full p-[2px] focus:outline-none select-none shadow-[0_0_10px_2px_rgba(59,130,246,0.25)]">
      <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#22d3ee_50%,#3b82f6_100%)]" />
      <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-4 py-1 text-sm font-medium text-white backdrop-blur-3xl">
        {children}
      </span>
    </div>
  )
}
