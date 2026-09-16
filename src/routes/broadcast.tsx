import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button, SectionHeader } from "@/components/app-shell";
import { Radio, Check, Clock, AlertCircle, Send } from "lucide-react";
import { useBroadcastController } from "../hooks/useBroadcastController";

export const Route = createFileRoute("/broadcast")({
  head: () => ({
    meta: [
      { title: "Broadcast Center — Versal Axis" },
      {
        name: "description",
        content: "Select verified providers and broadcast RFQs with real-time delivery tracking.",
      },
      { property: "og:title", content: "Broadcast Center — Versal Axis" },
      {
        property: "og:description",
        content: "Select verified providers and broadcast RFQs with real-time delivery tracking.",
      },
    ],
  }),
  component: Broadcast,
});

const providers = [
  { name: "Bramwell Facilities Ltd", region: "London", rating: 4.8, jobs: 142, match: 96 },
  { name: "NorthEdge Services", region: "Manchester", rating: 4.7, jobs: 98, match: 92 },
  { name: "Highfield Engineering", region: "Leeds", rating: 4.6, jobs: 74, match: 88 },
  { name: "Clyde & Ross Mechanical", region: "Glasgow", rating: 4.9, jobs: 205, match: 85 },
  { name: "Ashcroft Compliance Co.", region: "Birmingham", rating: 4.5, jobs: 61, match: 81 },
  { name: "Silverline Contracts", region: "Bristol", rating: 4.6, jobs: 88, match: 78 },
];

const history = [
  {
    rfq: "RFQ-24185",
    title: "Electrical rewiring — Warehouse B",
    sent: 12,
    delivered: 12,
    opened: 9,
    quoted: 6,
    at: "21 Jul, 12:04",
  },
  {
    rfq: "RFQ-24183",
    title: "CCTV upgrade across 4 branches",
    sent: 8,
    delivered: 8,
    opened: 7,
    quoted: 5,
    at: "20 Jul, 10:22",
  },
  {
    rfq: "RFQ-24180",
    title: "Boiler replacement — HQ",
    sent: 6,
    delivered: 6,
    opened: 6,
    quoted: 4,
    at: "19 Jul, 09:11",
  },
  {
    rfq: "RFQ-24178",
    title: "Car park resurfacing",
    sent: 10,
    delivered: 9,
    opened: 8,
    quoted: 7,
    at: "18 Jul, 14:58",
  },
];

function Broadcast() {
  const controller = useBroadcastController();

  return (
    <AppShell
      title="Broadcast Center"
      subtitle="Manage algorithm-matched provider pools and dispatch approved RFQs."
      actions={
        <Button size="sm">
          <Send className="w-3.5 h-3.5" />
          Broadcast selected
        </Button>
      }
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* RFQ Composer */}
        <Card className="p-5">
          <SectionHeader title="Broadcast draft" hint="RFQ-24188 · HVAC quarterly maintenance" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Requester</dt>
              <dd className="font-medium">Whitmore Retail Group</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Category</dt>
              <dd>HVAC · Maintenance</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Region</dt>
              <dd>London · 12 sites</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estimated value</dt>
              <dd className="font-medium tabular-nums">£42,000</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Response window</dt>
              <dd>72 hours</dd>
            </div>
          </dl>
          <div className="mt-5 p-3 rounded-lg bg-accent/25 border border-accent/40 text-xs text-foreground flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
            <span>
              18 providers match this category, region and insurance requirements. 6 pre-selected
              below.
            </span>
          </div>
          <div className="mt-5 flex gap-2">
            <Button size="sm" className="flex-1">
              <Radio className="w-3.5 h-3.5" />
              Broadcast now
            </Button>
            <Button variant="outline" size="sm">
              Schedule
            </Button>
          </div>
        </Card>

        {/* Provider selector */}
        <Card className="xl:col-span-2 p-5">
          <SectionHeader
            title="Select providers"
            hint="Ranked by match score, rating and job history"
            action={
              <Button variant="outline" size="sm">
                Filter
              </Button>
            }
          />
          <div className="divide-y divide-border">
            {providers.map((p) => (
              <label
                key={p.name}
                className="flex items-center gap-4 py-3 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded-lg"
              >
                <input type="checkbox" defaultChecked className="rounded" />
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                  {p.name
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.region} · {p.jobs} jobs · ★ {p.rating}
                  </div>
                </div>
                <div className="w-32 hidden md:block">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Match</span>
                    <span className="font-medium">{p.match}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${p.match}%` }} />
                  </div>
                </div>
                <Pill tone={p.match > 90 ? "success" : "info"}>
                  {p.match > 90 ? "Top match" : "Eligible"}
                </Pill>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Broadcast history */}
      <div className="mt-6">
        <Card>
          <div className="p-5 pb-3">
            <SectionHeader
              title="Broadcast history"
              hint="Delivery status across recent broadcasts"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-secondary/40">
                  <th className="px-5 py-2.5 text-left font-medium">RFQ</th>
                  <th className="px-3 py-2.5 text-right font-medium">Sent</th>
                  <th className="px-3 py-2.5 text-right font-medium">Delivered</th>
                  <th className="px-3 py-2.5 text-right font-medium">Opened</th>
                  <th className="px-3 py-2.5 text-right font-medium">Quoted</th>
                  <th className="px-3 py-2.5 text-left font-medium">Progress</th>
                  <th className="px-5 py-2.5 text-right font-medium">Sent at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((h) => {
                  const pct = Math.round((h.quoted / h.sent) * 100);
                  return (
                    <tr key={h.rfq} className="hover:bg-secondary/40">
                      <td className="px-5 py-3">
                        <div className="text-xs font-mono text-muted-foreground">{h.rfq}</div>
                        <div className="text-sm font-medium">{h.title}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{h.sent}</td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        <span className="inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-[oklch(0.55_0.14_155)]" />
                          {h.delivered}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{h.opened}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium">{h.quoted}</td>
                      <td className="px-3 py-3 w-40">
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {h.at}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
