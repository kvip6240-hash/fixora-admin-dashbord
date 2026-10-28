import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button } from "@/components/app-shell";
import { ApiError, exportAdminJobsCsv, fetchAdminJobs, type AdminJob, type AdminJobsQuery } from "@/lib/api";
import { Download, Eye, Search, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/download";

export const Route = createFileRoute("/rfq")({
  head: () => ({
    meta: [
      { title: "Jobs — Versal Axis" },
      {
        name: "description",
        content:
          "Review, approve, reject and share incoming jobs across the marketplace.",
      },
      { property: "og:title", content: "Jobs — Versal Axis" },
      {
        property: "og:description",
        content:
          "Review, approve, reject and share incoming jobs across the marketplace.",
      },
    ],
  }),
  component: RFQ,
});

const priorityTone = (p: string) =>
  p === "Emergency" ? "destructive" : p === "High" ? "warning" : p === "Medium" ? "info" : "muted";
const statusTone = (s: string) =>
  s === "Accepted" || s === "Completed"
    ? "success"
    : s === "Published" || s === "Assigned" || s === "In Progress"
      ? "info"
      : s === "Cancelled" || s === "Rejected"
        ? "destructive"
        : "muted";

const tabs: NonNullable<AdminJobsQuery["tab"]>[] = ["All", "Waiting Review", "Approved", "Broadcast", "Rejected"];
const businessStatuses = ["Accepted", "Published", "Assigned", "In Progress", "Completed", "Cancelled"];
const pageSize = 10;

function formatAmount(job: AdminJob): string {
  if (typeof job.value !== "number" || !job.currency) return "—";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: job.currency }).format(job.value);
  } catch {
    return `${job.currency} ${job.value.toLocaleString("en-GB")}`;
  }
}

function formatSubmittedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function RFQ() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("");
  const [tab, setTab] = useState<NonNullable<AdminJobsQuery["tab"]>>("All");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params: AdminJobsQuery = { search, priority, status, region, category, tab, page, limit: pageSize };
    setIsLoading(true);
    setLoadError(null);
    fetchAdminJobs(params, controller.signal)
      .then((response) => {
        setJobs(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
        setHasNextPage(response.pagination.hasNextPage);
        setHasPrevPage(response.pagination.hasPrevPage);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = error instanceof ApiError ? error.message : "Unable to load jobs. Please try again.";
        setLoadError(message);
        setJobs([]);
        setTotal(0);
        setTotalPages(0);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [search, priority, status, region, category, tab, page, reloadKey]);

  const exportRfqs = async () => {
    setIsExporting(true);
    try {
      const { blob, filename } = await exportAdminJobsCsv({ search, priority, status, region, category, tab });
      downloadBlob(blob, filename);
      toast.success("Jobs exported successfully.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to export jobs.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell
      title="Jobs"
      subtitle="Review and approve incoming requests from requesters."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={exportRfqs} disabled={isExporting}>
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "Exporting…" : "Export CSV"}
          </Button>
          <Button size="sm">Bulk actions</Button>
        </>
      }
    >
      {/* Filters bar */}
      <Card className="p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchInput}
            onChange={(event) => { setSearchInput(event.target.value); setPage(1); }}
            placeholder="Search by job number, title, requester…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm"
          />
        </div>
        <label className="relative inline-flex items-center">
          <select aria-label="Priority" value={priority} onChange={(event) => { setPriority(event.target.value); setPage(1); }} className="appearance-none h-9 pl-3 pr-8 rounded-lg bg-secondary/60 hover:bg-secondary text-sm">
            <option value="">All Priorities</option><option>Low</option><option>Medium</option><option>High</option><option>Emergency</option>
          </select><ChevronDown className="pointer-events-none absolute right-2 w-3.5 h-3.5 text-muted-foreground" />
        </label>
        <label className="relative inline-flex items-center">
          <select aria-label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setTab("All"); setPage(1); }} className="appearance-none h-9 pl-3 pr-8 rounded-lg bg-secondary/60 hover:bg-secondary text-sm">
            <option value="">All Statuses</option>{businessStatuses.map((item) => <option key={item}>{item}</option>)}
          </select><ChevronDown className="pointer-events-none absolute right-2 w-3.5 h-3.5 text-muted-foreground" />
        </label>
        <input aria-label="Region" value={region} onChange={(event) => { setRegion(event.target.value); setPage(1); }} placeholder="Region" className="h-9 w-28 px-3 rounded-lg bg-secondary/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm" />
        <input aria-label="Category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} placeholder="Category" className="h-9 w-32 px-3 rounded-lg bg-secondary/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm" />
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 mt-5 border-b border-border">
        {tabs.map((label) => (
          <button
            key={label}
            onClick={() => { setTab(label); setStatus(""); setPage(1); }}
            aria-current={tab === label ? "page" : undefined}
            className={`px-3.5 py-2.5 text-sm font-medium -mb-px border-b-2 ${tab === label ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border bg-secondary/40">
                <th className="px-4 py-3 text-left w-8">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-3 py-3 text-left font-medium">Job</th>
                <th className="px-3 py-3 text-left font-medium">Requester</th>
                <th className="px-3 py-3 text-left font-medium">Category</th>
                <th className="px-3 py-3 text-left font-medium">Priority</th>
                <th className="px-3 py-3 text-left font-medium">Status</th>
                <th className="px-3 py-3 text-right font-medium">Value</th>
                <th className="px-3 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Loading jobs…</td></tr>
              ) : loadError ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center"><div className="text-destructive">{loadError}</div><button className="mt-2 text-sm text-primary hover:underline" onClick={() => setReloadKey((current) => current + 1)}>Retry</button></td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No jobs found for these filters.</td></tr>
              ) : jobs.map((job) => (
                <tr key={job._id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs font-mono text-muted-foreground">{job.requestNumber || job._id}</div>
                    <div className="text-sm font-medium">{job.title}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm">{job.companyName || "Requester / company unavailable"}</div>
                    <div className="text-[11px] text-muted-foreground">{job.region || "—"}</div>
                  </td>
                  <td className="px-3 py-3 text-sm">{job.category || "—"}</td>
                  <td className="px-3 py-3">
                    <Pill tone={priorityTone(job.priority || "") as never}>{job.priority || "—"}</Pill>
                  </td>
                  <td className="px-3 py-3">
                    <Pill tone={statusTone(job.status) as never}>{job.status}</Pill>
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums">{formatAmount(job)}</td>
                  <td className="px-3 py-3 text-muted-foreground">{formatSubmittedAt(job.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-md hover:bg-secondary" title="View Job Details" aria-label={`View job ${job.requestNumber}`} onClick={() => navigate({ to: "/admin/requests/$requestId/rfq", params: { requestId: job._id } })}>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>{total === 0 ? "Showing 0 jobs" : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} jobs`}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={isLoading || !hasPrevPage || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
              Previous
            </Button>
            <span className="px-2">{page}{totalPages > 0 ? ` / ${totalPages}` : ""}</span>
            <Button variant="outline" size="sm" disabled={isLoading || !hasNextPage} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
