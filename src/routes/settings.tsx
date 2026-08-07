import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, SectionHeader, Button } from "@/components/app-shell";
import { useSettingsController } from "../hooks/useSettingsController";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Quotalink" },
      {
        name: "description",
        content:
          "Platform settings including commission rates, verification rules and notifications.",
      },
      { property: "og:title", content: "Settings — Quotalink" },
      {
        property: "og:description",
        content:
          "Platform settings including commission rates, verification rules and notifications.",
      },
    ],
  }),
  component: Settings,
});

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Settings() {
  const controller = useSettingsController();

  return (
    <AppShell
      title="Platform Settings"
      subtitle="Configure matching algorithms, commission structures and admin access."
    >
      <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 gap-6">
        <Card className="p-5">
          <SectionHeader title="Commission" hint="Applied automatically to every provider payout" />
          <Row label="Default commission" hint="Standard rate for all categories">
            <div className="inline-flex items-center gap-2">
              <input
                defaultValue="8"
                className="w-16 h-9 px-3 rounded-lg border border-border text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </Row>
          <Row label="Enterprise tier" hint="Applied when annual spend exceeds £250k">
            <div className="inline-flex items-center gap-2">
              <input
                defaultValue="6"
                className="w-16 h-9 px-3 rounded-lg border border-border text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </Row>
          <Row label="Emergency jobs" hint="Priority: Critical">
            <div className="inline-flex items-center gap-2">
              <input
                defaultValue="10"
                className="w-16 h-9 px-3 rounded-lg border border-border text-sm"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </Row>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Verification" hint="Documents required from every provider" />
          {[
            "Companies House registration",
            "Public liability insurance (min £5m)",
            "Employer's liability insurance",
            "ICO registration for data handling",
            "Trade body membership (Gas Safe, NICEIC, etc.)",
          ].map((d) => (
            <Row key={d} label={d}>
              <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded" />
                Required
              </label>
            </Row>
          ))}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionHeader title="Notifications" hint="Where operations alerts are delivered" />
          <Row
            label="Broadcast delivery failures"
            hint="Notify operations if a provider fails to receive an RFQ"
          >
            <select className="h-9 px-3 rounded-lg border border-border text-sm bg-card">
              <option>Email + In-app</option>
              <option>In-app only</option>
              <option>Off</option>
            </select>
          </Row>
          <Row label="SLA breaches" hint="RFQ review, quotation forwarding, verification">
            <select className="h-9 px-3 rounded-lg border border-border text-sm bg-card">
              <option>Email + Slack</option>
              <option>Email only</option>
            </select>
          </Row>
          <Row label="Payout blocks" hint="When bank details missing or KYC lapsed">
            <select className="h-9 px-3 rounded-lg border border-border text-sm bg-card">
              <option>Email + In-app</option>
              <option>In-app only</option>
            </select>
          </Row>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Save changes</Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
