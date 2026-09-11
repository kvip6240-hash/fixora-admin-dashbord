import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, SectionHeader, Pill, Button } from "@/components/app-shell";
import { useRfqController } from "../hooks/useRfqController";
import { Download, CheckCircle2, XCircle, Eye, Search, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { exportAdminCsv } from "@/lib/api";
import { downloadBlob } from "@/lib/download";

export const Route = createFileRoute("/rfq")({
  head: () => ({
    meta: [
      { title: "RFQ Management — Quotalink" },
      {
        name: "description",
        content:
          "Review, approve, reject and broadcast incoming Requests for Quotation across the marketplace.",
      },
      { property: "og:title", content: "RFQ Management — Quotalink" },
      {
        property: "og:description",
        content:
          "Review, approve, reject and broadcast incoming Requests for Quotation across the marketplace.",
      },
    ],
  }),
  component: RFQ,
});

const rows = [
  {
    id: "RFQ-24188",
    title: "HVAC quarterly maintenance — 12 sites",
    requester: "Whitmore Retail Group",
    region: "London",
    category: "HVAC",
    priority: "High",
    status: "Waiting Review",
    value: "£42,000",
    created: "22 Jul, 10:14",
  },
  {
    id: "RFQ-24187",
    title: "Emergency roof leak repair",
    requester: "Northlake Logistics",
    region: "Manchester",
    category: "Building",
    priority: "Critical",
    status: "Waiting Review",
    value: "£8,400",
    created: "22 Jul, 09:02",
  },
  {
    id: "RFQ-24186",
    title: "Annual fire safety inspection",
    requester: "Coleridge Hospitality",
    region: "Edinburgh",
    category: "Compliance",
    priority: "Medium",
    status: "Approved",
    value: "£15,200",
    created: "21 Jul, 16:40",
  },
  {
    id: "RFQ-24185",
    title: "Electrical rewiring — Warehouse B",
    requester: "Kingsford Manufacturing",
    region: "Leeds",
    category: "Electrical",
    priority: "High",
    status: "Broadcast",
    value: "£67,300",
    created: "21 Jul, 11:23",
  },
  {
    id: "RFQ-24184",
    title: "Landscaping & grounds contract 2026",
    requester: "Ashbury Property Trust",
    region: "Bristol",
    category: "Grounds",
    priority: "Low",
    status: "Waiting Review",
    value: "£23,800",
    created: "20 Jul, 14:08",
  },
  {
    id: "RFQ-24183",
    title: "CCTV upgrade across 4 branches",
    requester: "Meridian Financial",
    region: "Birmingham",
    category: "Security",
    priority: "Medium",
    status: "Broadcast",
    value: "£18,900",
    created: "20 Jul, 09:47",
  },
  {
    id: "RFQ-24182",
    title: "Lift servicing — annual programme",
    requester: "Ravenhill Estates",
    region: "Glasgow",
    category: "Mechanical",
    priority: "Medium",
    status: "Rejected",
    value: "£11,600",
    created: "19 Jul, 15:11",
  },
];

const priorityTone = (p: string) =>
  p === "Critical" ? "destructive" : p === "High" ? "warning" : p === "Medium" ? "info" : "muted";
const statusTone = (s: string) =>
  s === "Waiting Review"
    ? "warning"
    : s === "Broadcast"
      ? "info"
      : s === "Approved"
        ? "success"
        : s === "Rejected"
          ? "destructive"
          : "muted";

function RFQ() {
  const controller = useRfqController();
  const [isExporting, setIsExporting] = useState(false);

  const exportRfqs = async () => {
    setIsExporting(true);
    try {
      const { blob, filename } = await exportAdminCsv("rfqs");
      downloadBlob(blob, filename);
      toast.success("RFQs exported successfully.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to export RFQs.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell
      title="RFQ Management"
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
            placeholder="Search by RFQ ID, title, requester…"
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm"
          />
        </div>
        {["Priority", "Status", "Region", "Category"].map((f) => (
          <button
            key={f}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-secondary/60 hover:bg-secondary text-sm"
          >
            {f}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        ))}
        <Button variant="outline" size="sm">
          Advanced
        </Button>
      </Card>

      {/* Tabs */}
      <div className="flex items-center gap-1 mt-5 border-b border-border">
        {[
          ["All", 128],
          ["Waiting Review", 48],
          ["Approved", 33],
          ["Broadcast", 17],
          ["Rejected", 6],
        ].map(([label, count], i) => (
          <button
            key={label as string}
            className={`px-3.5 py-2.5 text-sm font-medium -mb-px border-b-2 ${i === 0 ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {label} <span className="ml-1 text-[11px] text-muted-foreground">{count}</span>
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
                <th className="px-3 py-3 text-left font-medium">RFQ</th>
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
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs font-mono text-muted-foreground">{r.id}</div>
                    <div className="text-sm font-medium">{r.title}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm">{r.requester}</div>
                    <div className="text-[11px] text-muted-foreground">{r.region}</div>
                  </td>
                  <td className="px-3 py-3 text-sm">{r.category}</td>
                  <td className="px-3 py-3">
                    <Pill tone={priorityTone(r.priority) as never}>{r.priority}</Pill>
                  </td>
                  <td className="px-3 py-3">
                    <Pill tone={statusTone(r.status) as never}>{r.status}</Pill>
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums">{r.value}</td>
                  <td className="px-3 py-3 text-muted-foreground">{r.created}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-md hover:bg-secondary" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-secondary text-[oklch(0.55_0.14_155)]"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-secondary text-destructive"
                        title="Reject"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing 7 of 128 RFQs</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm">
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
