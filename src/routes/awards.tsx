import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button, SectionHeader } from "@/components/app-shell";
import { Award, CheckCircle2, Clock, FileSignature } from "lucide-react";
import { useAwardsController } from "../hooks/useAwardsController";

export const Route = createFileRoute("/awards")({
  head: () => ({
    meta: [
      { title: "Award Management — Versal Axis" },
      {
        name: "description",
        content: "Confirm winning providers and issue work orders after requester selection.",
      },
      { property: "og:title", content: "Award Management — Versal Axis" },
      {
        property: "og:description",
        content: "Confirm winning providers and issue work orders after requester selection.",
      },
    ],
  }),
  component: Awards,
});

const awards = [
  {
    id: "AW-1042",
    rfq: "RFQ-24185",
    requester: "Kingsford Manufacturing",
    provider: "Bramwell Facilities Ltd",
    value: "£61,400",
    stage: "Requester Selected",
    eta: "Confirm within 24h",
  },
  {
    id: "AW-1041",
    rfq: "RFQ-24183",
    requester: "Meridian Financial",
    provider: "Silverline Contracts",
    value: "£18,200",
    stage: "Work Order Draft",
    eta: "Awaiting signature",
  },
  {
    id: "AW-1040",
    rfq: "RFQ-24179",
    requester: "Ashbury Property Trust",
    provider: "Clyde & Ross Mechanical",
    value: "£33,900",
    stage: "Confirmed",
    eta: "Provider notified",
  },
  {
    id: "AW-1039",
    rfq: "RFQ-24175",
    requester: "Whitmore Retail Group",
    provider: "Highfield Engineering",
    value: "£52,600",
    stage: "Confirmed",
    eta: "Provider notified",
  },
];

const stageTone = (s: string) =>
  s === "Requester Selected"
    ? "warning"
    : s === "Work Order Draft"
      ? "info"
      : s === "Confirmed"
        ? "success"
        : "muted";

function Awards() {
  const controller = useAwardsController();

  return (
    <AppShell
      title="Award Management"
      subtitle="Finalize requester decisions and generate work orders."
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Awaiting Admin Confirmation", value: 9, icon: Clock, tone: "warning" as const },
          { label: "Work Orders in Draft", value: 5, icon: FileSignature, tone: "info" as const },
          { label: "Confirmed This Week", value: 21, icon: CheckCircle2, tone: "success" as const },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary grid place-items-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-semibold tabular-nums">{k.value}</div>
                <div className="text-xs text-muted-foreground">{k.label}</div>
              </div>
              <Pill tone={k.tone}>Live</Pill>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="p-5 pb-3">
          <SectionHeader title="Award pipeline" hint="Selections returning from requesters" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-muted-foreground border-y border-border bg-secondary/40">
                <th className="px-5 py-2.5 text-left font-medium">Award</th>
                <th className="px-3 py-2.5 text-left font-medium">RFQ</th>
                <th className="px-3 py-2.5 text-left font-medium">Requester</th>
                <th className="px-3 py-2.5 text-left font-medium">Winning Provider</th>
                <th className="px-3 py-2.5 text-right font-medium">Value</th>
                <th className="px-3 py-2.5 text-left font-medium">Stage</th>
                <th className="px-5 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {awards.map((a) => (
                <tr key={a.id} className="hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{a.id}</td>
                  <td className="px-3 py-3 font-mono text-xs">{a.rfq}</td>
                  <td className="px-3 py-3">{a.requester}</td>
                  <td className="px-3 py-3 font-medium">{a.provider}</td>
                  <td className="px-3 py-3 text-right font-semibold tabular-nums">{a.value}</td>
                  <td className="px-3 py-3">
                    <div>
                      <Pill tone={stageTone(a.stage) as never}>{a.stage}</Pill>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">{a.eta}</div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm">
                      <Award className="w-3.5 h-3.5" />
                      {a.stage === "Confirmed" ? "View" : "Confirm"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
