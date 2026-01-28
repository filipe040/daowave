import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-zinc-800/60 bg-card/80 text-card-foreground shadow-xl shadow-purple-500/10 backdrop-blur-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)

const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn(
      "text-2xl sm:text-3xl font-bold tracking-tight",
      className
    )}
    {...props}
  />
)

const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-sm sm:text-base text-muted-foreground", className)}
    {...props}
  />
)

const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("pt-6 sm:pt-8", className)} {...props} />
)

const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "mt-6 sm:mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
      className
    )}
    {...props}
  />
)

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }

