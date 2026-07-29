import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button, SectionHeader } from "@/components/app-shell";
import { PlayCircle, Loader2, CheckCircle2, ShieldCheck, Upload, MapPin } from "lucide-react";
import { useProjectsController } from "../hooks/useProjectsController";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Quotalink" },
      { name: "description", content: "Track live projects from work start through verification and closeout." },
      { property: "og:title", content: "Projects — Quotalink" },
      { property: "og:description", content: "Track live projects from work start through verification and closeout." },
    ],
  }),
  component: Projects,
});

const columns = [
  { key: "started", title: "Work Started", icon: PlayCircle, tone: "info" as const, items: [
    { id: "PRJ-2145", title: "Boiler replacement — HQ", provider: "Clyde & Ross Mechanical", region: "Glasgow", value: "£24,300", progress: 12 },
    { id: "PRJ-2144", title: "Car park resurfacing", provider: "Silverline Contracts", region: "Bristol", value: "£31,900", progress: 22 },
  ]},
  { key: "progress", title: "In Progress", icon: Loader2, tone: "warning" as const, items: [
    { id: "PRJ-2141", title: "Electrical rewiring — Warehouse B", provider: "Bramwell Facilities Ltd", region: "Leeds", value: "£61,400", progress: 58 },
    { id: "PRJ-2140", title: "CCTV upgrade — 4 branches", provider: "Silverline Contracts", region: "Birmingham", value: "£18,200", progress: 72 },
    { id: "PRJ-2138", title: "HVAC quarterly — 12 sites", provider: "NorthEdge Services", region: "London", value: "£42,000", progress: 44 },
  ]},
  { key: "completed", title: "Completed", icon: CheckCircle2, tone: "success" as const, items: [
    { id: "PRJ-2132", title: "Fire alarm testing programme", provider: "Ashcroft Compliance Co.", region: "Edinburgh", value: "£12,600", progress: 100 },
    { id: "PRJ-2129", title: "Roof leak repair — DC-2", provider: "NorthEdge Services", region: "Manchester", value: "£8,400", progress: 100 },
  ]},
  { key: "verification", title: "Verification Pending", icon: ShieldCheck, tone: "accent" as const, items: [
    { id: "PRJ-2127", title: "Annual fire safety inspection", provider: "Ashcroft Compliance Co.", region: "Edinburgh", value: "£15,200", progress: 100 },
    { id: "PRJ-2124", title: "Landscaping refresh — Q2", provider: "Silverline Contracts", region: "Bristol", value: "£9,900", progress: 100 },
  ]},
];

function Projects() {
  const controller = useProjectsController();

  return (
    <AppShell
      title="Projects"
      subtitle="Kanban view of every confirmed project on the platform."
      actions={<Button variant="outline" size="sm"><Upload className="w-3.5 h-3.5" />Upload report</Button>}
    >
      <div className="grid grid-cols-1 min-[768px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1440px]:grid-cols-4 gap-4">
        {columns.map((col) => {
          const Icon = col.icon;
          return (
            <div key={col.key} className="rounded-xl bg-surface-muted/70 border border-border p-3">
              <div className="flex items-center justify-between px-1 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md grid place-items-center bg-card border border-border text-primary"><Icon className="w-3.5 h-3.5" /></div>
                  <span className="text-sm font-semibold">{col.title}</span>
                </div>
                <Pill tone={col.tone}>{col.items.length}</Pill>
              </div>
              <div className="space-y-2.5">
                {col.items.map((item) => (
                  <Card key={item.id} className="p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-muted-foreground">{item.id}</span>
                      <span className="text-xs font-semibold tabular-nums">{item.value}</span>
                    </div>
                    <div className="text-sm font-medium mt-1.5 leading-snug">{item.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{item.region} · {item.provider}</div>
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{item.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${item.progress}%` }} />
                      </div>
                    </div>
                    {col.key === "verification" && (
                      <div className="mt-3 flex gap-1.5">
                        <Button size="sm" className="flex-1">Verify</Button>
                        <Button variant="outline" size="sm" className="flex-1">Report</Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Card className="mt-6 p-5">
        <SectionHeader title="Verification checklist" hint="Standard items reviewed before releasing payment" />
        <div className="grid grid-cols-1 min-[768px]:grid-cols-2 gap-3">
          {[
            "Signed completion report received from provider",
            "Requester on-site sign-off attached",
            "Before / after photographs uploaded",
            "Compliance certificates (Gas Safe, NICEIC, etc.)",
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
