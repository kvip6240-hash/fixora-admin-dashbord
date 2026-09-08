import { useQuery } from "@tanstack/react-query";
import {
  fetchReportsDashboard,
  fetchReportsMonthlyRfq,
  fetchReportsCategoryMix,
  fetchReportsRegionalPerformance,
  exportReportFile,
  type ReportsFilterParams,
} from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";

export function useReportsController(initialParams?: ReportsFilterParams) {
  const [params, setParams] = useState<ReportsFilterParams>(initialParams || {});
  const [isExporting, setIsExporting] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ["reports-dashboard", params],
    queryFn: () => fetchReportsDashboard(params),
    staleTime: 30_000,
  });

  const monthlyRfqQuery = useQuery({
    queryKey: ["reports-monthly-rfq", params],
    queryFn: () => fetchReportsMonthlyRfq(params),
    staleTime: 30_000,
  });

  const categoryMixQuery = useQuery({
    queryKey: ["reports-category-mix", params],
    queryFn: () => fetchReportsCategoryMix(params),
    staleTime: 30_000,
  });

  const regionalPerformanceQuery = useQuery({
    queryKey: ["reports-regional-performance", params],
    queryFn: () => fetchReportsRegionalPerformance(params),
    staleTime: 30_000,
  });

  const handleExport = async (format: "excel" | "csv" | "pdf") => {
    setIsExporting(true);
    try {
      const blob = await exportReportFile(format, params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fixora-report-${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    params,
    setParams,
    isExporting,
    handleExport,
    dashboardData: dashboardQuery.data?.data,
    monthlyRfqData: monthlyRfqQuery.data?.data,
    categoryMixData: categoryMixQuery.data?.data,
    regionalPerformanceData: regionalPerformanceQuery.data?.data,
    isLoading:
      dashboardQuery.isLoading ||
      monthlyRfqQuery.isLoading ||
      categoryMixQuery.isLoading ||
      regionalPerformanceQuery.isLoading,
    isError:
      dashboardQuery.isError ||
      monthlyRfqQuery.isError ||
      categoryMixQuery.isError ||
      regionalPerformanceQuery.isError,
  };
}

