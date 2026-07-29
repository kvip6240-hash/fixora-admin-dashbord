import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, SectionHeader, Pill } from "@/components/app-shell";
import { useReportsController } from "../hooks/useReportsController";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — Quotalink" },
      { name: "description", content: "Marketplace analytics on RFQ throughput, conversion, commission and category mix." },
      { property: "og:title", content: "Reports & Analytics — Quotalink" },
      { property: "og:description", content: "Marketplace analytics on RFQ throughput, conversion, commission and category mix." },
    ],
  }),
  component: Reports,
});

const bars = [42, 55, 48, 66, 71, 58, 74, 88, 82, 95, 101, 118];
const months = ["Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May","Jun","Jul"];

function Reports() {
  const controller = useReportsController();
  const max = Math.max(...bars);
  return (
    <AppShell title="Reports & Analytics" subtitle="Marketplace volume, category breakdowns and regional performance.">
      <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[1024px]:grid-cols-4 gap-4">
        {[
          { l: "RFQ Throughput", v: "1,284", d: "+18.4%" },
          { l: "Quotation Rate", v: "72%", d: "+3.1pp" },
          { l: "Award Conversion", v: "58%", d: "+2.4pp" },
          { l: "Avg. Commission", v: "8.0%", d: "Stable" },
        ].map(k => (
          <Card key={k.l} className="p-4">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className="text-2xl font-semibold mt-1 tabular-nums">{k.v}</div>
            <Pill tone="success">{k.d}</Pill>
          </Card>
        ))}
      </div>

      <Card className="p-5 mt-6">
        <SectionHeader title="RFQ volume — trailing 12 months" hint="Requests submitted per month" />
        <div className="flex items-end gap-2 h-56">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full rounded-md bg-primary/85 hover:bg-primary transition-colors" style={{ height: `${(b/max)*100}%` }} />
              <span className="text-[11px] text-muted-foreground">{months[i]}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-5">
          <SectionHeader title="Category mix" hint="Share of RFQ value" />
          {[
            { l: "Facilities", v: 32 }, { l: "Electrical", v: 24 }, { l: "HVAC", v: 18 },
            { l: "Compliance", v: 14 }, { l: "Grounds", v: 8 }, { l: "Security", v: 4 },
          ].map(c => (
            <div key={c.l} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1"><span>{c.l}</span><span className="font-medium">{c.v}%</span></div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary" style={{width:`${c.v*3}%`}} /></div>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <SectionHeader title="Regional performance" hint="Awards issued per region" />
          {[
            { r: "London", v: 128 }, { r: "Manchester", v: 92 }, { r: "Leeds", v: 74 },
            { r: "Birmingham", v: 61 }, { r: "Glasgow", v: 48 }, { r: "Bristol", v: 36 },
          ].map((r, i) => (
            <div key={r.r} className="flex items-center gap-3 py-2 border-b last:border-b-0 border-border">
              <span className="w-6 text-xs text-muted-foreground tabular-nums">#{i+1}</span>
              <span className="flex-1 text-sm">{r.r}</span>
              <span className="text-sm font-semibold tabular-nums">{r.v}</span>
              <Pill tone={i < 2 ? "success" : "muted"}>{i < 2 ? "Top" : "Steady"}</Pill>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}
