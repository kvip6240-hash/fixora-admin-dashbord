import { AppShell, Card, SectionHeader, Pill, Button } from "@/components/app-shell";
import { createFileRoute } from "@tanstack/react-router";
import { useDashboardController } from "../hooks/useDashboardController";
import {
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Radio,
  ClipboardList,
  Award,
  Briefcase,
  Wallet,
  CircleCheck,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Download,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Operations Control Center — Quotalink" },
      { name: "description", content: "Real-time RFQ marketplace operations, quotations, awards and payments for UK enterprise buyers." },
      { property: "og:title", content: "Operations Control Center — Quotalink" },
      { property: "og:description", content: "Real-time RFQ marketplace operations, quotations, awards and payments for UK enterprise buyers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const kpis = [
  { label: "Pending RFQs", value: "48", delta: "+12", trend: "up", icon: FileText, tone: "primary" as const, hint: "Awaiting admin review" },
  { label: "Broadcast Queue", value: "17", delta: "+4", trend: "up", icon: Radio, tone: "info" as const, hint: "Ready to dispatch" },
  { label: "Quotations Received", value: "126", delta: "+23", trend: "up", icon: ClipboardList, tone: "accent" as const, hint: "Last 7 days" },
  { label: "Award Pending", value: "9", delta: "-2", trend: "down", icon: Award, tone: "warning" as const, hint: "Requester decision" },
  { label: "Active Projects", value: "34", delta: "+3", trend: "up", icon: Briefcase, tone: "primary" as const, hint: "In progress on-site" },
];

const workflow = [
  { stage: "RFQs Waiting Review", count: 48, tone: "primary" as const, icon: FileText },
  { stage: "Broadcast Queue", count: 17, tone: "info" as const, icon: Radio },
  { stage: "Quotations Waiting Approval", count: 22, tone: "accent" as const, icon: ClipboardList },
  { stage: "Award Pending", count: 9, tone: "warning" as const, icon: Award },
  { stage: "Work Verification", count: 6, tone: "info" as const, icon: CircleCheck },
  { stage: "Pending Client Payments", count: 11, tone: "warning" as const, icon: Wallet },
  { stage: "Provider Payout Queue", count: 14, tone: "primary" as const, icon: Wallet },
];

const recentRfqs = [
  { id: "RFQ-24188", title: "HVAC quarterly maintenance — 12 sites", requester: "Whitmore Retail Group", region: "London", priority: "High", status: "Waiting Review", value: "£42,000", age: "12m" },
  { id: "RFQ-24187", title: "Emergency roof leak repair", requester: "Northlake Logistics", region: "Manchester", priority: "Critical", status: "Broadcast", value: "£8,400", age: "1h" },
  { id: "RFQ-24186", title: "Annual fire safety inspection", requester: "Coleridge Hospitality", region: "Edinburgh", priority: "Medium", status: "Quotations In", value: "£15,200", age: "3h" },
  { id: "RFQ-24185", title: "Electrical rewiring — Warehouse B", requester: "Kingsford Manufacturing", region: "Leeds", priority: "High", status: "Award Pending", value: "£67,300", age: "1d" },
  { id: "RFQ-24184", title: "Landscaping & grounds contract 2026", requester: "Ashbury Property Trust", region: "Bristol", priority: "Low", status: "Waiting Review", value: "£23,800", age: "1d" },
  { id: "RFQ-24183", title: "CCTV upgrade across 4 branches", requester: "Meridian Financial", region: "Birmingham", priority: "Medium", status: "Broadcast", value: "£18,900", age: "2d" },
];

const priorityTone = (p: string) =>
  p === "Critical" ? "destructive" : p === "High" ? "warning" : p === "Medium" ? "info" : "muted";
const statusTone = (s: string) =>
  s === "Waiting Review" ? "warning" : s === "Broadcast" ? "info" : s === "Quotations In" ? "accent" : s === "Award Pending" ? "primary" : "muted";

function Dashboard() {
  const controller = useDashboardController();

  return (
    <AppShell
      title="Operations Control Center"
      subtitle="Live view of the RFQ lifecycle across every UK region."
      actions={
        <>
          <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5" />Export</Button>
          <Button size="sm"><Plus className="w-3.5 h-3.5" />New RFQ</Button>
        </>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-5 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg grid place-items-center bg-primary/10 text-primary">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${k.trend === "up" ? "text-[oklch(0.55_0.14_155)]" : "text-destructive"}`}>
                  {k.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {k.delta}
                </span>
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{k.value}</div>
              <div className="text-xs font-medium text-foreground mt-0.5">{k.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.hint}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-6">
        {/* Recent RFQs */}
        <div className="xl:col-span-2">
          <Card>
            <div className="p-5 pb-3 flex items-end justify-between">
              <div>
                <h2 className="text-sm font-semibold">Recent RFQs</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Latest requests entering the pipeline</p>
              </div>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-secondary/40">
                    <th className="text-left font-medium px-5 py-2.5">RFQ</th>
                    <th className="text-left font-medium px-3 py-2.5">Requester</th>
                    <th className="text-left font-medium px-3 py-2.5">Priority</th>
                    <th className="text-left font-medium px-3 py-2.5">Status</th>
                    <th className="text-right font-medium px-3 py-2.5">Value</th>
                    <th className="text-right font-medium px-5 py-2.5">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentRfqs.map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-xs font-mono text-muted-foreground">{r.id}</div>
                        <div className="text-sm font-medium text-foreground line-clamp-1">{r.title}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-sm">{r.requester}</div>
                        <div className="text-[11px] text-muted-foreground">{r.region}</div>
                      </td>
                      <td className="px-3 py-3"><Pill tone={priorityTone(r.priority) as never}>{r.priority}</Pill></td>
                      <td className="px-3 py-3"><Pill tone={statusTone(r.status) as never}>{r.status}</Pill></td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">{r.value}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground tabular-nums">{r.age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Workflow Queue */}
        <Card className="p-5">
          <SectionHeader title="Workflow Queue" hint="Bottlenecks across the RFQ lifecycle" />
          <ul className="space-y-1.5">
            {workflow.map((w) => {
              const Icon = w.icon;
              return (
                <li key={w.stage} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="w-8 h-8 rounded-md grid place-items-center bg-secondary text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{w.stage}</div>
                    <div className="text-[11px] text-muted-foreground">Auto-updated moments ago</div>
                  </div>
                  <Pill tone={w.tone}>{w.count}</Pill>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      {/* Commission + Payouts */}
      <div className="mt-6 grid grid-cols-1 min-[1024px]:grid-cols-3 gap-6">
        <Card className="min-[1024px]:col-span-2 flex flex-col h-[400px]">
          <SectionHeader title="Commission Earned" hint="Rolling 30-day" />
          <div className="text-3xl font-semibold tracking-tight">£38,412</div>
          <div className="text-xs text-[oklch(0.55_0.14_155)] mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> +14.2% vs previous period
          </div>
          <div className="mt-5 space-y-2">
            {[
              { label: "Facilities", pct: 62 },
              { label: "Electrical", pct: 48 },
              { label: "HVAC", pct: 35 },
              { label: "Grounds", pct: 22 },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium tabular-nums">{s.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 min-[1024px]:col-span-2">
          <SectionHeader
            title="Payout & Verification Board"
            hint="Actions requiring the operations team"
            action={<Button variant="outline" size="sm">Open queue</Button>}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: "Work Verification", value: 6, desc: "Completion reports pending sign-off", icon: CircleCheck, tone: "info" as const },
              { title: "Pending Client Payments", value: 11, desc: "Invoices past due > 48h", icon: Clock, tone: "warning" as const },
              { title: "Provider Payout Queue", value: 14, desc: "Ready after commission deduction", icon: Wallet, tone: "primary" as const },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-lg border border-border p-4 bg-surface-muted/40">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-md bg-card border border-border grid place-items-center text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <Pill tone={c.tone}>{c.value}</Pill>
                  </div>
                  <div className="mt-3 text-sm font-semibold">{c.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-5 border-t border-border">
            <SectionHeader title="Alerts" hint="Requires attention within SLA" />
            <ul className="space-y-2">
              {[
                { icon: AlertTriangle, tone: "warning", text: "3 RFQs breached 24h review SLA in Manchester region." },
                { icon: AlertTriangle, tone: "destructive", text: "Provider payout of £12,480 blocked — bank details pending." },
                { icon: Clock, tone: "info", text: "Broadcast to 8 providers scheduled at 16:00 GMT." },
              ].map((a, i) => {
                const Icon = a.icon;
                return (
                  <li key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50">
                    <div className="w-7 h-7 rounded-md grid place-items-center bg-secondary text-foreground shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-sm flex-1">{a.text}</div>
                    <button className="p-1 rounded-md hover:bg-secondary"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
