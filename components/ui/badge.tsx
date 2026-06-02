import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-white hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-white hover:bg-secondary/80",
        destructive:
          "border-transparent bg-danger text-white hover:bg-danger/80",
        outline: "text-foreground border-border-custom",
        success: "border-transparent bg-success text-white hover:bg-success/80",
        warning: "border-transparent bg-warning text-white hover:bg-warning/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
})
Badge.displayName = "Badge"

export { Badge, badgeVariants }
