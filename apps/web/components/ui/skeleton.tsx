import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-zinc-800/10 dark:bg-zinc-50/10", className)}
            {...props}
        />
    )
}

export { Skeleton }
