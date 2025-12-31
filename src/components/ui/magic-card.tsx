"use client"

import { useRef, useState, type MouseEvent, type ReactNode } from "react"

import { cn } from "@/lib/utils"

interface MagicCardProps {
  children: ReactNode
  className?: string
  gradientSize?: number
  gradientColor?: string
}

export function MagicCard({
  children,
  className,
  gradientSize = 500,
  gradientColor = "rgba(59,130,246,.2)",
}: MagicCardProps) {
  const divRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return

    const rect = divRef.current.getBoundingClientRect()
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMouseEnter = () => {
    setOpacity(1)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-r from-background to-background/40 p-4 md:p-6",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(${gradientSize}px circle at ${position.x}px ${position.y}px, ${gradientColor}, transparent 60%)`,
        }}
      />
      {children}
    </div>
  )
}
