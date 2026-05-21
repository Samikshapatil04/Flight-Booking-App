import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg bg-sky-800/40 shimmer', className)} />
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex items-center gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-0.5 w-full" />
        </div>
        <div className="space-y-1.5 text-right">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-1 flex-1 self-center" />
        <Skeleton className="h-12 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}
