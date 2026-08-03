import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button, SectionHeader } from "@/components/app-shell";
import {
  PlayCircle,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Search,
  X,
  MapPin,
  CalendarDays,
  Tag,
  Building2,
  Paperclip,
} from "lucide-react";
import { useProjectsController } from "../hooks/useProjectsController";
import { SkeletonCard } from "@/components/skeletons";
import type { ProjectRequest } from "@/lib/api";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Project Requests — Fixora Admin" },
      { name: "description", content: "Track and manage all project requests submitted on Fixora." },
      { property: "og:title", content: "Project Requests — Fixora Admin" },
      { property: "og:description", content: "Track and manage all project requests submitted on Fixora." },
    ],
  }),
  component: Projects,
});

// Status → Kanban column mapping
const STATUS_COLUMNS = [
  { key: "submitted", title: "Submitted", icon: PlayCircle, tone: "info" as const, statuses: ["submitted", "pending"] },
  { key: "in_progress", title: "In Progress", icon: Loader2, tone: "warning" as const, statuses: ["in_progress", "assigned"] },
  { key: "completed", title: "Completed", icon: CheckCircle2, tone: "success" as const, statuses: ["completed"] },
  { key: "verification", title: "Verification Pending", icon: ShieldCheck, tone: "accent" as const, statuses: ["verification", "review"] },
];

function normaliseStatus(status?: string): string {
  return (status ?? "").toLowerCase().replace(/\s+/g, "_");
}

function getColumn(status?: string) {
  const s = normaliseStatus(status);
  return STATUS_COLUMNS.find((col) => col.statuses.some((st) => s.includes(st))) ?? STATUS_COLUMNS[0];
}

function formatDate(val: unknown): string {
  if (!val) return "—";
  try {
    return new Date(String(val)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(val);
  }
}

function getCategoryName(category: ProjectRequest["category"]): string {
  if (!category) return "—";
  if (typeof category === "string") return category;
  if (typeof category === "object" && "name" in category) return String(category.name);
  return "—";
}

function getCompanyName(company: ProjectRequest["company"]): string {
  if (!company) return "—";
  if (typeof company === "string") return company;
  if (typeof company === "object" && "name" in company) return String((company as { name?: unknown }).name ?? "—");
  return "—";
}

// ─── Detail Modal ────────────────────────────────────────────────────────────

function DetailModal({
  project,
  onClose,
}: {
  project: ProjectRequest;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-y-auto max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-xs font-mono text-muted-foreground">{project._id}</div>
            <h2 className="text-base font-semibold mt-1">
              {String(project.title ?? project.description ?? "Project Request")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status */}
        <div className="mb-4">
          <Pill tone={getColumn(project.status).tone}>
            {project.status ?? "Unknown"}
          </Pill>
        </div>

        {/* Details Grid */}
        <dl className="space-y-3 text-sm">
          {/* Company */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
            <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Company</dt>
              <dd className="font-medium mt-0.5">{getCompanyName(project.company)}</dd>
            </div>
          </div>

          {/* Category */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
            <Tag className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Category</dt>
              <dd className="font-medium mt-0.5">{getCategoryName(project.category)}</dd>
            </div>
          </div>

          {/* Location */}
          {project.location && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Location</dt>
                <dd className="font-medium mt-0.5">{String(project.location)}</dd>
              </div>
            </div>
          )}

          {/* Schedule */}
          {project.schedule && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
              <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Schedule</dt>
                <dd className="font-medium mt-0.5">{String(project.schedule)}</dd>
              </div>
            </div>
          )}

          {/* Submitted */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
            <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <dt className="text-[11px] text-muted-foreground uppercase tracking-wide">Submitted</dt>
              <dd className="font-medium mt-0.5">{formatDate(project.createdAt)}</dd>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div className="p-3 rounded-lg bg-secondary/40">
              <dt className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">
                Project Details
              </dt>
              <dd className="text-sm leading-relaxed">{String(project.description)}</dd>
            </div>
          )}

          {/* Attachments */}
          {Array.isArray(project.attachments) && project.attachments.length > 0 && (
            <div className="p-3 rounded-lg bg-secondary/40">
              <dt className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                <Paperclip className="w-3 h-3" /> Attachments
              </dt>
              <ul className="space-y-1">
                {project.attachments.map((url, i) => (
                  <li key={i}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-xs hover:underline break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </dl>

        <div className="mt-5 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Projects() {
  const {
    requests,
    total,
    page,
    totalPages,
    isLoading,
    selectedProject,
    detailLoading,
    handleSearch,
    handleStatusFilter,
    statusFilter,
    openDetail,
    closeDetail,
    setPage,
  } = useProjectsController();

  // Group requests by kanban column
  const columns = STATUS_COLUMNS.map((col) => ({
    ...col,
    items: requests.filter((r) => {
      const norm = normaliseStatus(r.status);
      return col.statuses.some((st) => norm.includes(st));
    }),
  }));

  // If no requests match any column, fall into first column for display
  const unmatched = requests.filter(
    (r) => !STATUS_COLUMNS.some((col) => col.statuses.some((st) => normaliseStatus(r.status).includes(st))),
  );
  if (unmatched.length > 0) columns[0].items.push(...unmatched);

  return (
    <AppShell
      title="Project Requests"
      subtitle="All submitted project requests, organised by status."
    >
      {/* Detail Modal */}
      {selectedProject && <DetailModal project={selectedProject} onClose={closeDetail} />}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Filters & Search */}
      <Card className="p-3 flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search by title, company, category…"
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm"
          />
        </div>
        {/* Status filter buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => handleStatusFilter("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === ""
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {STATUS_COLUMNS.map((col) => (
            <button
              key={col.key}
              onClick={() => handleStatusFilter(col.statuses[0])}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === col.statuses[0]
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {col.title}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {isLoading ? "Loading…" : `${total} requests`}
        </div>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 min-[768px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1440px]:grid-cols-4 gap-4">
        {columns.map((col) => {
          const Icon = col.icon;
          return (
            <div key={col.key} className="rounded-xl bg-surface-muted/70 border border-border p-3">
              <div className="flex items-center justify-between px-1 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md grid place-items-center bg-card border border-border text-primary">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-semibold">{col.title}</span>
                </div>
                <Pill tone={col.tone}>{isLoading ? "…" : col.items.length}</Pill>
              </div>

              <div className="space-y-2.5">
                {isLoading
                  ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
                  : col.items.length === 0
                    ? (
                      <div className="text-center text-xs text-muted-foreground py-6">
                        No requests
                      </div>
                    )
                    : col.items.map((item) => (
                      <Card key={item._id} className="p-3.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {item._id.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </span>
                        </div>
                        <div className="text-sm font-medium mt-1.5 leading-snug line-clamp-2">
                          {String(item.title ?? item.description ?? "Project Request")}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {getCompanyName(item.company)}
                        </div>
                        {getCategoryName(item.category) !== "—" && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {getCategoryName(item.category)}
                          </div>
                        )}
                        {item.location && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {String(item.location)}
                          </div>
                        )}
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => openDetail(item._id)}
                          >
                            Open Details
                          </Button>
                        </div>
                      </Card>
                    ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Verification Checklist */}
      <Card className="mt-6 p-5">
        <SectionHeader title="Verification checklist" hint="Standard items reviewed before releasing payment" />
        <div className="grid grid-cols-1 min-[768px]:grid-cols-2 gap-3">
          {[
            "Signed completion report received from provider",
            "Requester on-site sign-off attached",
            "Before / after photographs uploaded",
            "Compliance certificates verified",
            "Waste transfer note / COSHH documents",
            "Snag list resolved and re-inspected",
          ].map((c) => (
            <label key={c} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/40 cursor-pointer">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">{c}</span>
            </label>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
