import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default:
          "border-[1.5px] border-[var(--ink)] bg-primary font-semibold text-primary-foreground",
        secondary: "border-border bg-secondary text-secondary-foreground",
        destructive: "border-destructive/40 bg-destructive/12 text-destructive",
        outline: "border-[1.5px] border-[var(--ink)] bg-card text-foreground",
        ghost: "border-transparent hover:bg-muted hover:text-muted-foreground",
        amber:
          "border-[1.5px] border-[var(--ink)] bg-[var(--chapter-1)] font-semibold text-[var(--chapter-1-ink)]",
        mint: "border-[1.5px] border-[var(--ink)] bg-[var(--chapter-2)] font-semibold text-[var(--chapter-2-ink)]",
        periwinkle:
          "border-[1.5px] border-[var(--ink)] bg-[var(--chapter-3)] font-semibold text-[var(--chapter-3-ink)]",
        peach:
          "border-[1.5px] border-[var(--ink)] bg-[var(--chapter-4)] font-semibold text-[var(--chapter-4-ink)]",
        sky: "border-[1.5px] border-[var(--ink)] bg-[var(--chapter-5)] font-semibold text-[var(--chapter-5-ink)]",
        lavender:
          "border-[1.5px] border-[var(--ink)] bg-[var(--chapter-6)] font-semibold text-[var(--chapter-6-ink)]",
        coral:
          "border-[1.5px] border-[var(--ink)] bg-[var(--chapter-7)] font-semibold text-[var(--chapter-7-ink)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
