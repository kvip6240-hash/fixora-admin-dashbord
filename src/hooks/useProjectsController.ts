/**
 * src/hooks/useProjectsController.ts
 * Fetches project requests with pagination/search/filter/sort.
 * Also provides fetchDetail() for GET /api/admin/project-requests/:id.
 */
import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjectRequests,
  fetchProjectRequestById,
  type ProjectRequest,
  type PaginatedResponse,
} from "@/lib/api";

export function useProjectsController() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("");
  const [selectedProject, setSelectedProject] = useState<ProjectRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const queryKey = ["project-requests", page, search, statusFilter, sort];

  const { data, isLoading, isError } = useQuery<PaginatedResponse<ProjectRequest>>({
    queryKey,
    queryFn: () =>
      fetchProjectRequests({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        sort: sort || undefined,
      }),
    staleTime: 20_000,
    retry: 1,
  });

  /** Debounced search */
  const handleSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setPage(1);
  }, []);

  const handleSort = useCallback((sortField: string) => {
    setSort(sortField);
  }, []);

  /** Fetch full detail for one project request — always hits the network */
  const openDetail = useCallback(
    async (id: string, fallbackProject?: ProjectRequest) => {
      setDetailLoading(true);
      try {
        // Always fetch fresh data so RFQ acceptance is reflected immediately
        const res = await fetchProjectRequestById(id);
        const detail = (res as any)?.data ?? (res as any)?.project ?? res;
        // Populate the per-item cache for RequestDetailModal
        queryClient.setQueryData(["project-request", id], detail);
        setSelectedProject(detail);
      } catch {
        // On error, fall back to whatever we already have locally
        const cached = queryClient.getQueryData<ProjectRequest>(["project-request", id]);
        if (cached) {
          setSelectedProject(cached);
        } else if (fallbackProject) {
          setSelectedProject(fallbackProject);
        }
      } finally {
        setDetailLoading(false);
      }
    },
    [queryClient],
  );

  const closeDetail = useCallback(() => setSelectedProject(null), []);

  return {
    requests: data?.data ?? [],
    total: data?.total ?? 0,
    page,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    isError,
    selectedProject,
    detailLoading,
    handleSearch,
    handleStatusFilter,
    handleSort,
    statusFilter,
    openDetail,
    closeDetail,
    setPage,
  };
}
