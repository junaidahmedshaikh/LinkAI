import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getActivities } from "@/api/activity.api";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { Pagination } from "@/components/dashboard/Pagination";
import { Card, Loader } from "@/components/ui";

export default function ActivityPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["activities", page],
    queryFn: () => getActivities(page, 20),
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: "Activity" }]} />
      <h1 className="text-2xl font-bold text-white mb-6">Activity</h1>

      <Card animate={false}>
        {isLoading ? (
          <Loader />
        ) : (
          <>
            <ActivityFeed activities={data?.items ?? []} />
            <Pagination
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>
    </div>
  );
}
