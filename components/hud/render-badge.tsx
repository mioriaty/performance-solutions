"use client"

import { useEffect, useRef } from "react"
import { useTelemetryStore } from "@/lib/telemetry/store"
import { cn } from "@/lib/utils"

interface RenderBadgeProps {
  name: string
  count?: number
  className?: string
  trackGlobal?: boolean
}

export function RenderBadge({
  name,
  count: externalCount,
  className,
  trackGlobal = true,
}: RenderBadgeProps) {
  const renderCountRef = useRef(0)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const countSpanRef = useRef<HTMLSpanElement>(null)
  const renderFlashEnabled = useTelemetryStore((s) => s.renderFlashEnabled)

  useEffect(() => {
    renderCountRef.current += 1
    const count = externalCount ?? renderCountRef.current

    if (countSpanRef.current) {
      countSpanRef.current.textContent = `${count}x`
    }

    if (trackGlobal && externalCount === undefined) {
      const timer = window.setTimeout(() => {
        useTelemetryStore.getState().incrementRender(1)
      }, 0)
      if (renderFlashEnabled && badgeRef.current && count > 1) {
        badgeRef.current.animate(
          [
            {
              backgroundColor: "rgba(235, 180, 116, 0.55)",
              transform: "scale(1.05)",
            },
            {
              backgroundColor: "transparent",
              transform: "scale(1)",
            },
          ],
          { duration: 360, easing: "ease-out" }
        )
      }
      return () => window.clearTimeout(timer)
    }
  })

  return (
    <span
      ref={badgeRef}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)] px-1.5 py-0.5 font-mono text-[10px] leading-none whitespace-nowrap text-foreground transition-colors",
        className
      )}
      title={`${name} render counter`}
    >
      <span className="opacity-70">{name}:</span>
      <span ref={countSpanRef} className="font-bold">
        {externalCount !== undefined ? `${externalCount}x` : "1x"}
      </span>
    </span>
  )
}
