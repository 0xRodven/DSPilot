"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface LampContainerProps {
  children: ReactNode
  className?: string
}

export function LampContainer({ children, className }: LampContainerProps) {
  return (
    <div
      className={cn(
        "relative z-0 flex min-h-[500px] w-full flex-col items-center justify-start overflow-hidden bg-transparent pt-20",
        className
      )}
    >
      {/* Glow effect that blends with the page background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute left-1/2 top-10 h-[200px] w-[400px] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[80px]" />
      </div>

      {/* Lamp visual effect */}
      <div className="relative isolate z-10 flex w-full scale-y-100 items-center justify-center">
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="bg-gradient-conic absolute inset-auto right-1/2 h-40 w-[30rem] overflow-visible from-blue-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute bottom-0 left-0 z-20 h-32 w-[100%] bg-[#0a0a0a] [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute bottom-0 left-0 z-20 h-[100%] w-32 bg-[#0a0a0a] [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "15rem" }}
          whileInView={{ opacity: 1, width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="bg-gradient-conic absolute inset-auto left-1/2 h-40 w-[30rem] from-transparent via-transparent to-blue-500 text-white [--conic-position:from_290deg_at_center_top]"
        >
          <div className="absolute bottom-0 right-0 z-20 h-[100%] w-32 bg-[#0a0a0a] [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute bottom-0 right-0 z-20 h-32 w-[100%] bg-[#0a0a0a] [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>

        {/* Central glow */}
        <div className="absolute inset-auto z-30 h-24 w-[24rem] -translate-y-4 rounded-full bg-blue-500 opacity-40 blur-3xl" />
        <motion.div
          initial={{ width: "8rem" }}
          whileInView={{ width: "16rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-30 h-24 w-64 -translate-y-[4rem] rounded-full bg-blue-400 blur-2xl"
        />
        <motion.div
          initial={{ width: "15rem" }}
          whileInView={{ width: "30rem" }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[5rem] bg-blue-400"
        />
      </div>

      {/* Content */}
      <div className="relative z-50 mt-8 flex flex-col items-center px-5">
        {children}
      </div>
    </div>
  )
}
