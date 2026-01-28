import * as React from "react"
import { cn } from "@/lib/utils"

const alertVariants = {
  default:
    "border-zinc-700/60 bg-zinc-900/70 text-zinc-100",
  success:
    "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
  error:
    "border-red-500/60 bg-red-500/10 text-red-300",
  warning:
    "border-yellow-500/60 bg-yellow-500/10 text-yellow-200",
  info:
    "border-purple-500/60 bg-purple-500/10 text-purple-200",
} as const

export type AlertVariant = keyof typeof alertVariants

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm sm:text-base",
        alertVariants[variant],
        className
      )}
      {...props}
    />
  )
)
Alert.displayName = "Alert"

const AlertTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
)

const AlertDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "text-sm sm:text-base opacity-90",
      className
    )}
    {...props}
  />
)

export { Alert, AlertTitle, AlertDescription }

