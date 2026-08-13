/**
 * src/hooks/useDashboardController.ts
 * Fetches live stats from GET /api/admin/dashboard using React Query.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, type DashboardStats } from "@/lib/api";

export function useDashboardController() {
  const { data, isLoading, isError, error } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 0,               // always fetch fresh on focus/mount
    refetchOnWindowFocus: true, // refresh when admin switches back to this tab
    refetchInterval: 30_000,    // background poll every 30 s
    retry: 1,
  });

  return { stats: data ?? null, isLoading, isError, error };
}
