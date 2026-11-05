import React from "react"

export function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          return (
            <code
              key={index}
              className="rounded border border-border/80 bg-muted px-1.5 py-0.5 font-mono text-[13px] font-medium text-foreground"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        if (
          part.startsWith("**") &&
          part.endsWith("**") &&
          part.length >= 4
        ) {
          return (
            <strong key={index} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
      })}
    </>
  )
}
