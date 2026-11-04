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
              backgroundColor: "rgba(245, 158, 11, 0.45)",
              transform: "scale(1.06)",
            },
            {
              backgroundColor: "transparent",
              transform: "scale(1)",
            },
          ],
          { duration: 380, easing: "ease-out" }
        )
      }
      return () => window.clearTimeout(timer)
    }
  })

  return (
    <span
      ref={badgeRef}
      className={cn(
        "inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] leading-none text-emerald-600 transition-colors dark:text-emerald-400",
        className
      )}
      title={`${name} render counter`}
    >
      <span className="opacity-75">{name}:</span>
      <span ref={countSpanRef} className="font-semibold">
        {externalCount !== undefined ? `${externalCount}x` : "1x"}
      </span>
    </span>
  )
}
