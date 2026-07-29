import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button, SectionHeader } from "@/components/app-shell";
import { ShieldCheck, Building2, Star } from "lucide-react";
import { useCompaniesController } from "../hooks/useCompaniesController";

export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Companies — Quotalink" },
      { name: "description", content: "Verified requester and provider companies transacting on the platform." },
      { property: "og:title", content: "Companies — Quotalink" },
      { property: "og:description", content: "Verified requester and provider companies transacting on the platform." },
    ],
  }),
  component: Companies,
});

const companies = [
  { name: "Bramwell Facilities Ltd", type: "Provider", region: "London", verified: true, rating: 4.8, projects: 142, spend: "£1.24m" },
  { name: "Whitmore Retail Group", type: "Requester", region: "London", verified: true, rating: 4.9, projects: 87, spend: "£820k" },
  { name: "NorthEdge Services", type: "Provider", region: "Manchester", verified: true, rating: 4.7, projects: 98, spend: "£640k" },
  { name: "Kingsford Manufacturing", type: "Requester", region: "Leeds", verified: true, rating: 4.6, projects: 51, spend: "£410k" },
  { name: "Clyde & Ross Mechanical", type: "Provider", region: "Glasgow", verified: true, rating: 4.9, projects: 205, spend: "£1.88m" },
  { name: "Ashbury Property Trust", type: "Requester", region: "Bristol", verified: false, rating: 4.4, projects: 22, spend: "£188k" },
];

function Companies() {
  const controller = useCompaniesController();

  return (
    <AppShell title="Companies & Verification" subtitle="Manage requesters and providers on the platform.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "Verified Providers", value: "246", hint: "+8 this month" },
          { label: "Active Requesters", value: "184", hint: "+12 this month" },
          { label: "Pending KYC", value: "9", hint: "Awaiting docs" },
        ].map((k) => (
          <Card key={k.label} className="p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-accent/40 text-accent-foreground grid place-items-center"><Building2 className="w-5 h-5" /></div>
            <div>
              <div className="text-2xl font-semibold">{k.value}</div>
              <div className="text-xs text-muted-foreground">{k.label} · {k.hint}</div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="p-5 pb-3"><SectionHeader title="All companies" hint="Filter by role, region, or verification status" action={<Button variant="outline" size="sm">Invite company</Button>} /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 border-y border-border text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Company</th>
                <th className="px-3 py-2.5 text-left font-medium">Role</th>
                <th className="px-3 py-2.5 text-left font-medium">Region</th>
                <th className="px-3 py-2.5 text-left font-medium">Rating</th>
                <th className="px-3 py-2.5 text-right font-medium">Projects</th>
                <th className="px-3 py-2.5 text-right font-medium">Lifetime value</th>
                <th className="px-5 py-2.5 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.map((c) => (
                <tr key={c.name} className="hover:bg-secondary/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center text-xs font-semibold">{c.name.split(" ").map(w=>w[0]).slice(0,2).join("")}</div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3"><Pill tone={c.type === "Provider" ? "primary" : "info"}>{c.type}</Pill></td>
                  <td className="px-3 py-3 text-muted-foreground">{c.region}</td>
                  <td className="px-3 py-3 inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current text-[oklch(0.78_0.15_75)]" />{c.rating}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.projects}</td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums">{c.spend}</td>
                  <td className="px-5 py-3 text-right">
                    {c.verified ? <Pill tone="success"><ShieldCheck className="w-3 h-3" />Verified</Pill> : <Pill tone="warning">KYC pending</Pill>}
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
