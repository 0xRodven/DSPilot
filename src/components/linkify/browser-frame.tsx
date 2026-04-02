"use client";

import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  children: React.ReactNode;
  url?: string;
  className?: string;
  perspective?: boolean;
}

export function BrowserFrame({
  children,
  url = "app.dspilot.fr/dashboard",
  className,
  perspective = true,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-transform duration-700",
        perspective && "hover:!transform-none",
        className,
      )}
      style={{
        background: "#FFFFFF",
        borderColor: "#E8E5DF",
        boxShadow: "0 25px 80px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
        transform: perspective ? "perspective(1400px) rotateY(-2deg) rotateX(1.5deg)" : undefined,
      }}
    >
      {/* macOS title bar */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{ background: "#FAFAF8", borderColor: "#E8E5DF" }}
      >
        <div className="flex gap-2">
          <span className="size-3 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="size-3 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="size-3 rounded-full" style={{ background: "#28C840" }} />
        </div>
        <div
          className="mx-auto max-w-xs flex-1 rounded-md px-3 py-1 text-center text-xs"
          style={{ background: "#F0EEEA", color: "#8A8A8A" }}
        >
          {url}
        </div>
        <div className="w-[52px]" />
      </div>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
