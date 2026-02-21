/** Named shimmer skeleton exports for dashboard loading states */

export function KpiGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className={`grid gap-4 grid-cols-2 lg:grid-cols-${count} animate-pulse`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
                    <div className="w-9 h-9 rounded-xl bg-gray-100" />
                    <div className="space-y-2">
                        <div className="h-2.5 w-16 bg-gray-100 rounded" />
                        <div className="h-8 w-24 bg-gray-100 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden animate-pulse">
            <div className="px-6 py-3.5 border-b border-gray-100 flex gap-8">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="h-3 w-16 bg-gray-100 rounded" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-gray-50 last:border-0 flex gap-8 items-center">
                    <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-32 bg-gray-100 rounded" />
                        <div className="h-3 w-24 bg-gray-50 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-gray-50 rounded" />
                    <div className="h-5 w-14 bg-gray-100 rounded-md" />
                    <div className="h-3 w-16 bg-gray-50 rounded" />
                </div>
            ))}
        </div>
    );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 space-y-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                            <div className="h-4 w-36 bg-gray-100 rounded" />
                            <div className="h-3 w-24 bg-gray-50 rounded" />
                        </div>
                        <div className="h-5 w-16 bg-gray-100 rounded-md" />
                    </div>
                    <div className="h-3 w-full bg-gray-50 rounded" />
                </div>
            ))}
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <KpiGridSkeleton count={4} />
            <TableSkeleton rows={5} />
        </div>
    );
}
