"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface AnimationContainerProps {
  children: ReactNode
  className?: string
  reverse?: boolean
  delay?: number
}

export function AnimationContainer({
  children,
  className,
  reverse = false,
  delay = 0,
}: AnimationContainerProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: reverse ? -20 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false }}
      transition={{
        duration: 0.2,
        delay,
        ease: "easeInOut",
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    >
      {children}
    </motion.div>
  )
}
