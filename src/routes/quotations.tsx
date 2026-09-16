import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button, SectionHeader } from "@/components/app-shell";
import { Forward, Eye, TrendingDown, TrendingUp, Star } from "lucide-react";
import { useQuotationsController } from "../hooks/useQuotationsController";

export const Route = createFileRoute("/quotations")({
  head: () => ({
    meta: [
      { title: "Quotation Management — Versal Axis" },
      {
        name: "description",
        content: "Compare incoming provider quotations and forward the shortlist to requesters.",
      },
      { property: "og:title", content: "Quotation Management — Versal Axis" },
      {
        property: "og:description",
        content: "Compare incoming provider quotations and forward the shortlist to requesters.",
      },
    ],
  }),
  component: Quotations,
});

const incoming = [
  {
    id: "Q-88214",
    rfq: "RFQ-24185",
    provider: "Bramwell Facilities Ltd",
    amount: "£61,400",
    timeline: "14 days",
    rating: 4.8,
    submitted: "22 Jul",
    status: "New",
  },
  {
    id: "Q-88213",
    rfq: "RFQ-24185",
    provider: "NorthEdge Services",
    amount: "£58,900",
    timeline: "18 days",
    rating: 4.7,
    submitted: "22 Jul",
    status: "New",
  },
  {
    id: "Q-88212",
    rfq: "RFQ-24185",
    provider: "Highfield Engineering",
    amount: "£67,300",
    timeline: "12 days",
    rating: 4.6,
    submitted: "21 Jul",
    status: "Reviewed",
  },
  {
    id: "Q-88211",
    rfq: "RFQ-24183",
    provider: "Silverline Contracts",
    amount: "£18,200",
    timeline: "10 days",
    rating: 4.6,
    submitted: "21 Jul",
    status: "Forwarded",
  },
  {
    id: "Q-88210",
    rfq: "RFQ-24183",
    provider: "Clyde & Ross Mechanical",
    amount: "£19,700",
    timeline: "8 days",
    rating: 4.9,
    submitted: "20 Jul",
    status: "Forwarded",
  },
];

const compareRfq = "RFQ-24185 · Electrical rewiring — Warehouse B";
const compareRows = [
  {
    provider: "Bramwell Facilities Ltd",
    amount: 61400,
    timeline: 14,
    warranty: "24 months",
    rating: 4.8,
    insurance: "£10m",
    jobs: 142,
    best: "Value",
  },
  {
    provider: "NorthEdge Services",
    amount: 58900,
    timeline: 18,
    warranty: "18 months",
    rating: 4.7,
    insurance: "£5m",
    jobs: 98,
    best: "Lowest",
  },
  {
    provider: "Highfield Engineering",
    amount: 67300,
    timeline: 12,
    warranty: "36 months",
    rating: 4.6,
    insurance: "£10m",
    jobs: 74,
    best: "Fastest",
  },
];

const statusTone = (s: string) =>
  s === "New" ? "info" : s === "Reviewed" ? "warning" : s === "Forwarded" ? "success" : "muted";

function Quotations() {
  const controller = useQuotationsController();
  const min = Math.min(...compareRows.map((r) => r.amount));
  return (
    <AppShell
      title="Quotation Management"
      subtitle="Incoming quotations from verified providers, ready for admin review."
    >
      {/* Incoming */}
      <Card className="overflow-hidden">
        <div className="p-5 pb-3">
          <SectionHeader
            title="Incoming quotations"
            hint="Latest submissions from broadcast recipients"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-secondary/40">
                <th className="px-5 py-2.5 text-left font-medium">Quotation</th>
                <th className="px-3 py-2.5 text-left font-medium">RFQ</th>
                <th className="px-3 py-2.5 text-left font-medium">Provider</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-3 py-2.5 text-left font-medium">Timeline</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {incoming.map((q) => (
                <tr key={q.id} className="hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{q.id}</td>
                  <td className="px-3 py-3 font-mono text-xs">{q.rfq}</td>
                  <td className="px-3 py-3">
                    <div className="text-sm font-medium">{q.provider}</div>
                    <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current text-[oklch(0.78_0.15_75)]" />{" "}
                      {q.rating}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{q.amount}</td>
                  <td className="px-3 py-3">{q.timeline}</td>
                  <td className="px-3 py-3">
                    <Pill tone={statusTone(q.status) as never}>{q.status}</Pill>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="w-3.5 h-3.5" />
                        Profile
                      </Button>
                      <Button size="sm">
                        <Forward className="w-3.5 h-3.5" />
                        Forward
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Compare */}
      <Card className="p-5 mt-6">
        <SectionHeader
          title={`Compare quotations · ${compareRfq}`}
          hint="Side-by-side view before forwarding to requester"
          action={
            <Button size="sm">
              <Forward className="w-3.5 h-3.5" />
              Forward shortlist
            </Button>
          }
        />
        <div className="grid grid-cols-1 min-[800px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-4">
          {compareRows.map((r) => {
            const isMin = r.amount === min;
            return (
              <div
                key={r.provider}
                className={`rounded-xl border p-4 ${isMin ? "border-primary bg-primary/[0.04]" : "border-border bg-card"}`}
              >
                <div className="flex items-center justify-between">
                  <Pill tone={isMin ? "primary" : "muted"}>{r.best}</Pill>
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current text-[oklch(0.78_0.15_75)]" /> {r.rating}
                  </div>
                </div>
                <div className="mt-3 text-lg font-semibold">{r.provider}</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums">
                    £{r.amount.toLocaleString()}
                  </span>
                  {isMin && (
                    <span className="inline-flex items-center text-[oklch(0.55_0.14_155)] text-xs">
                      <TrendingDown className="w-3 h-3" />
                      Lowest
                    </span>
                  )}
                  {!isMin && (
                    <span className="inline-flex items-center text-muted-foreground text-xs">
                      <TrendingUp className="w-3 h-3" />
                      +£{(r.amount - min).toLocaleString()}
                    </span>
                  )}
                </div>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Timeline</dt>
                    <dd>{r.timeline} days</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Warranty</dt>
                    <dd>{r.warranty}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Insurance</dt>
                    <dd>{r.insurance}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Completed jobs</dt>
                    <dd>{r.jobs}</dd>
                  </div>
                </dl>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Provider profile
                  </Button>
                  <Button size="sm" className="flex-1">
                    Shortlist
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}
