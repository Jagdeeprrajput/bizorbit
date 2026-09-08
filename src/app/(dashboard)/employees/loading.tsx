import { PageHeaderSkeleton, TableSkeleton } from "@/components/shared/loading-skeletons";

export default function EmployeesLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeaderSkeleton />
      <div className="mt-8">
        <TableSkeleton rows={8} />
      </div>
    </div>
  );
}
