/**
 * src/hooks/useCompaniesController.ts
 * Manages companies list with pagination, search, active/inactive filter,
 * and status toggle via PUT /api/admin/companies/:id/status.
 */
import { useState, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchCompanies,
  updateCompanyStatus,
  type Company,
  type PaginatedResponse,
} from "@/lib/api";

export function useCompaniesController() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive isActive param from filter
  const isActiveParam =
    activeFilter === "active" ? true : activeFilter === "inactive" ? false : undefined;

  const queryKey = ["companies", page, search, activeFilter];

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Company>>({
    queryKey,
    queryFn: () =>
      fetchCompanies({ page, limit: 10, search: search || undefined, isActive: isActiveParam }),
    staleTime: 20_000,
    retry: 1,
  });

  /** Debounced search — waits 400ms after user stops typing */
  const handleSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1); // reset to first page on new search
    }, 400);
  }, []);

  const handleFilterChange = useCallback((filter: "all" | "active" | "inactive") => {
    setActiveFilter(filter);
    setPage(1);
  }, []);

  /** Toggle company active/inactive status */
  const toggleStatus = useCallback(
    async (company: Company) => {
      const newStatus = !company.isActive;
      setTogglingId(company._id);
      try {
        await updateCompanyStatus(company._id, newStatus);
        toast.success(
          `${company.name} has been ${newStatus ? "activated" : "deactivated"}.`,
        );
        // Invalidate cache so list refreshes
        queryClient.invalidateQueries({ queryKey: ["companies"] });
      } catch {
        // ApiError already showed a toast in api.ts
      } finally {
        setTogglingId(null);
      }
    },
    [queryClient],
  );

  return {
    companies: data?.data ?? [],
    total: data?.total ?? 0,
    page,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    isError,
    togglingId,
    handleSearch,
    handleFilterChange,
    activeFilter,
    setPage,
    toggleStatus,
  };
}
