import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button, SectionHeader } from "@/components/app-shell";
import { useSupportController } from "../hooks/useSupportController";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Quotalink" },
      {
        name: "description",
        content: "Support tickets from requesters and providers across the marketplace.",
      },
      { property: "og:title", content: "Support — Quotalink" },
      {
        property: "og:description",
        content: "Support tickets from requesters and providers across the marketplace.",
      },
    ],
  }),
  component: Support,
});

const tickets = [
  {
    id: "T-3821",
    subject: "Cannot upload completion report",
    from: "Bramwell Facilities Ltd",
    type: "Provider",
    priority: "High",
    status: "Open",
    updated: "12m",
  },
  {
    id: "T-3820",
    subject: "Quotation shortlist not received",
    from: "Kingsford Manufacturing",
    type: "Requester",
    priority: "Medium",
    status: "In Progress",
    updated: "1h",
  },
  {
    id: "T-3819",
    subject: "Payout delayed by 48h",
    from: "Silverline Contracts",
    type: "Provider",
    priority: "High",
    status: "Waiting",
    updated: "3h",
  },
  {
    id: "T-3818",
    subject: "How do I edit an active RFQ?",
    from: "Coleridge Hospitality",
    type: "Requester",
    priority: "Low",
    status: "Resolved",
    updated: "1d",
  },
];
const tone = (s: string) =>
  s === "Open" ? "warning" : s === "In Progress" ? "info" : s === "Waiting" ? "accent" : "success";

function Support() {
  const controller = useSupportController();

  return (
    <AppShell
      title="Support"
      subtitle="Tickets raised by requesters and providers on the platform."
    >
      <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[1024px]:grid-cols-4 gap-4">
        {[
          { l: "Open", v: 12 },
          { l: "In Progress", v: 8 },
          { l: "Waiting on user", v: 5 },
          { l: "Resolved (7d)", v: 34 },
        ].map((k) => (
          <Card key={k.l} className="p-4">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className="text-2xl font-semibold mt-1 tabular-nums">{k.v}</div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="p-5 pb-3">
          <SectionHeader
            title="Tickets"
            hint="Latest support requests"
            action={<Button size="sm">New ticket</Button>}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 border-y border-border text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Ticket</th>
                <th className="px-3 py-2.5 text-left font-medium">From</th>
                <th className="px-3 py-2.5 text-left font-medium">Priority</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-secondary/40">
                  <td className="px-5 py-3">
                    <div className="font-mono text-xs text-muted-foreground">{t.id}</div>
                    <div className="text-sm font-medium">{t.subject}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm">{t.from}</div>
                    <div className="text-[11px] text-muted-foreground">{t.type}</div>
                  </td>
                  <td className="px-3 py-3">
                    <Pill
                      tone={
                        t.priority === "High"
                          ? "destructive"
                          : t.priority === "Medium"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {t.priority}
                    </Pill>
                  </td>
                  <td className="px-3 py-3">
                    <Pill tone={tone(t.status) as never}>{t.status}</Pill>
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{t.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
