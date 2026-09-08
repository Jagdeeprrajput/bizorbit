import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/shared/loading-skeletons";

export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <CardGridSkeleton />
      </div>
    </div>
  );
}
