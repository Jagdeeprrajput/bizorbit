import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/shared/loading-skeletons";

export default function SalesLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeaderSkeleton />
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CardGridSkeleton count={4} />
        </div>
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
