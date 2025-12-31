import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface MaxWidthWrapperProps {
  children: ReactNode
  className?: string
}

export function MaxWidthWrapper({ children, className }: MaxWidthWrapperProps) {
  return (
    <section
      className={cn(
        "mx-auto h-full w-full max-w-screen-xl px-4 md:px-12 lg:px-20",
        className
      )}
    >
      {children}
    </section>
  )
}
