import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 bg-primary/5">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="p-0">
          <div className="grid grid-cols-7 bg-muted/50">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center border-r border-b py-2">
                <Skeleton className="h-3 w-16 mb-1" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="grid grid-cols-1 gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 