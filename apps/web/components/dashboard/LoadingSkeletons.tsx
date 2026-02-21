/** Named shimmer skeleton exports for dashboard loading states */

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid gap-4 grid-cols-2 lg:grid-cols-${count} animate-pulse`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white/[0.03] backdrop-blur-xl rounded-[24px] border border-white/10 p-8 space-y-6 shadow-2xl">
                    <div className="w-10 h-10 rounded-xl bg-white/5" />
                    <div className="space-y-3">
                        <div className="h-2 w-16 bg-white/5 rounded" />
                        <div className="h-8 w-28 bg-white/10 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-[24px] border border-white/10 shadow-2xl overflow-hidden animate-pulse">
            <div className="px-8 py-5 border-b border-white/5 flex gap-10">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-2.5 w-16 bg-white/5 rounded" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="px-8 py-6 border-b border-white/5 last:border-0 flex gap-10 items-center">
                    <div className="space-y-2 flex-1">
                        <div className="h-4 w-40 bg-white/10 rounded" />
                        <div className="h-3 w-28 bg-white/5 rounded" />
                    </div>
                    <div className="h-4 w-24 bg-white/5 rounded" />
                    <div className="h-6 w-16 bg-white/10 rounded-xl" />
                    <div className="h-3 w-20 bg-white/5 rounded" />
                </div>
            ))}
        </div>
    );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-4 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white/[0.03] backdrop-blur-xl rounded-[24px] border border-white/10 p-6 space-y-4 shadow-2xl">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <div className="h-4 w-48 bg-white/10 rounded" />
                            <div className="h-3 w-32 bg-white/5 rounded" />
                        </div>
                        <div className="h-6 w-20 bg-white/10 rounded-xl" />
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded" />
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
            <div className="md:col-span-2 h-[300px] bg-white/5 rounded-[32px]" />
            <div className="h-[300px] bg-white/5 rounded-[32px]" />
            <div className="col-span-full h-24 bg-white/5 rounded-[24px]" />
        </div>
    );
}
