/**
 * src/components/dashboard/RecentBookingsTable.tsx
 *
 * Displays the latest project requests from GET /api/admin/project-requests.
 * Columns: Request Number, Company Name, Service, Project Title, Priority, Status, Submitted Date, Submitted Time.
 * Clicking a row fires onView(project) to open the detail modal.
 */
import { Eye, Inbox } from "lucide-react";
import { Card, SectionHeader, Button } from "@/components/app-shell";
import type { ProjectRequest } from "@/lib/api";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getCategoryName(req: ProjectRequest): string {
  const r = req as any;
  for (const key of ["categoryId", "categoryName", "category", "serviceCategory", "service"]) {
    const val = r[key];
    if (!val) continue;
    if (typeof val === "string") return val;
    if (typeof val === "object" && !Array.isArray(val)) {
      if (val.name) return String(val.name);
      if (val.title) return String(val.title);
    }
  }
  return "—";
}

function getCompanyName(req: ProjectRequest): string {
  const r = req as any;
  if (r.companyName) return String(r.companyName);
  if (typeof r.company === "string") return r.company;
  if (r.company && typeof r.company === "object") {
    if (r.company.name) return String(r.company.name);
    if (r.company.companyName) return String(r.company.companyName);
  }
  if (r.companyId && typeof r.companyId === "object") {
    if (r.companyId.name) return String(r.companyId.name);
    if (r.companyId.companyName) return String(r.companyId.companyName);
  }
  const user = r.requesterId || r.requester || r.user;
  if (user && typeof user === "object") {
    if (user.companyName) return String(user.companyName);
    if (user.name) return String(user.name);
  }
  return "—";
}

function formatDate(raw?: string): { date: string; time: string } {
  if (!raw) return { date: "—", time: "—" };
  try {
    const d = new Date(raw);
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { date, time };
  } catch {
    return { date: "—", time: "—" };
  }
}

function getProjectTitle(req: ProjectRequest): string {
  const r = req as any;
  return r.title || r.projectName || r.name || "—";
}

function getRequestNumber(req: ProjectRequest): string {
  const r = req as any;
  return r.requestNumber || r.reqNumber || r.code || r._id?.slice(-6)?.toUpperCase() || "—";
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  submitted: { bg: "bg-blue-50 border-blue-200",     text: "text-blue-700",    dot: "bg-blue-500" },
  rfq:       { bg: "bg-purple-50 border-purple-200", text: "text-purple-700",  dot: "bg-purple-500" },
  published: { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500" },
  assigned:  { bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700",  dot: "bg-indigo-500" },
  accepted:  { bg: "bg-teal-50 border-teal-200",     text: "text-teal-700",    dot: "bg-teal-500" },
  completed: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { bg: "bg-slate-100 border-slate-200",  text: "text-slate-600",   dot: "bg-slate-400" },
  rejected:  { bg: "bg-red-50 border-red-200",       text: "text-red-700",     dot: "bg-red-500" },
};

function StatusPill({ status }: { status?: string }) {
  const key = (status ?? "").toLowerCase();
  const style = STATUS_STYLES[key] ?? { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status || "—"}
    </span>
  );
}

// ─── Priority Badge ───────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  high:      { bg: "bg-red-50 border-red-200", text: "text-red-700" },
  emergency: { bg: "bg-rose-950 border-rose-900", text: "text-rose-100" },
  medium:    { bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
  low:       { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
};

function PriorityPill({ priority }: { priority?: string }) {
  const key = (priority ?? "").toLowerCase();
  const style = PRIORITY_STYLES[key] ?? { bg: "bg-slate-100 border-slate-200", text: "text-slate-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}>
      {priority || "—"}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RecentBookingsTable({
  bookings,
  isLoading,
  onView,
  onViewAll,
}: {
  bookings: ProjectRequest[];
  isLoading?: boolean;
  onView?: (booking: ProjectRequest) => void;
  onViewAll?: () => void;
}) {
  return (
    <Card className="p-5 border-border/80 bg-white">
      <SectionHeader
        title="Recent Bookings"
        hint="Latest project requests submitted to the platform"
        action={
          <Button variant="outline" size="sm" onClick={onViewAll}>
            View All
          </Button>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4 rounded-l-lg">Request #</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Project Title</th>
              <th className="py-3 px-4">Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Submitted Date</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4 text-right rounded-r-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="py-3.5 px-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + (j * 13) % 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300" />
                    <span className="text-sm font-medium">No recent project requests found.</span>
                  </div>
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const r = b as any;
                const rawDate = r.createdAt || r.submittedAt || r.created_at || r.date || r.updatedAt;
                const { date, time } = formatDate(rawDate);
                return (
                  <tr
                    key={String(b._id)}
                    onClick={() => onView?.(b)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-900">
                      {getRequestNumber(b)}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 max-w-[140px] truncate">
                      {getCompanyName(b)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[120px] truncate">
                      {getCategoryName(b)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-[180px] truncate font-medium">
                      {getProjectTitle(b)}
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityPill priority={String(r.priority ?? "—")} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusPill status={String(r.status ?? "—")} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">{date}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">{time}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); onView?.(b); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
