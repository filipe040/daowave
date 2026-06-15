/** Named shimmer skeleton exports for dashboard loading states */

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="dash-card p-4 sm:p-6 space-y-4">
                    <div className="flex gap-3 sm:block sm:space-y-4">
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-2 w-16 bg-neutral-100 rounded" />
                            <div className="h-7 sm:h-8 w-24 bg-neutral-200 rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="dash-card overflow-hidden animate-pulse">
            <div className="px-8 py-5 border-b border-white/10 flex gap-10">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-2.5 w-16 bg-neutral-200 rounded" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="px-8 py-6 border-b border-white/10 last:border-0 flex gap-10 items-center">
                    <div className="space-y-2 flex-1">
                        <div className="h-4 w-40 bg-neutral-200 rounded" />
                        <div className="h-3 w-28 bg-neutral-100 rounded" />
                    </div>
                    <div className="h-4 w-24 bg-neutral-100 rounded" />
                    <div className="h-6 w-16 bg-neutral-200 rounded-xl" />
                    <div className="h-3 w-20 bg-neutral-100 rounded" />
                </div>
            ))}
        </div>
    );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="dash-card p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <div className="h-4 w-48 bg-neutral-200 rounded" />
                            <div className="h-3 w-32 bg-neutral-100 rounded" />
                        </div>
                        <div className="h-6 w-20 bg-neutral-200 rounded-xl" />
                    </div>
                    <div className="h-2.5 w-full bg-neutral-100 rounded" />
                </div>
            ))}
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <KpiGridSkeleton count={4} />
            <TableSkeleton rows={5} />
        </div>
    );
}

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="md:col-span-2 h-[300px] bg-neutral-100 rounded-[32px] border border-white/10" />
            <div className="h-[300px] bg-neutral-100 rounded-[32px] border border-white/10" />
            <div className="col-span-full h-24 bg-neutral-100 rounded-[24px] border border-white/10" />
        </div>
    );
}
