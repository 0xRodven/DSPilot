import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface BentoGridProps {
  children: ReactNode
  className?: string
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 gap-4 md:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  )
}

interface BentoCardProps {
  name: string
  description: string
  icon: ReactNode
  className?: string
  background?: ReactNode
  href?: string
}

export function BentoCard({
  name,
  description,
  icon,
  className,
  background,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-xl",
        "border border-border/60 bg-background/50 backdrop-blur-sm",
        "transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10",
        className
      )}
    >
      {background && (
        <div className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-70">
          {background}
        </div>
      )}
      <div className="pointer-events-none relative z-10 flex flex-col gap-1 p-6">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            {icon}
          </div>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">{name}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
    </div>
  )
}
