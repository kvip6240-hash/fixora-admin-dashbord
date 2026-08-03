import { AppShell, Card, SectionHeader, Pill, Button } from "@/components/app-shell";
import { createFileRoute } from "@tanstack/react-router";
import { useDashboardController } from "../hooks/useDashboardController";
import { SkeletonKpi } from "@/components/skeletons";
import {
  Building2,
  Tag,
  FileText,
  Radio,
  Briefcase,
  Wallet,
  CircleCheck,
  Clock,
  DollarSign,
  CreditCard,
  Download,
} from "lucide-react";

export const Route = createFileRoute("/")(  {
  head: () => ({
    meta: [
      { title: "Dashboard — Fixora Admin" },
      { name: "description", content: "Real-time operations overview for Fixora Admin." },
      { property: "og:title", content: "Dashboard — Fixora Admin" },
      { property: "og:description", content: "Real-time operations overview for Fixora Admin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

// Helper to format currency numbers
function formatCurrency(value: number | undefined | null): string {
  if (value == null) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}m`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value}`;
}

function fmt(value: number | undefined | null): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

function Dashboard() {
  const { stats, isLoading } = useDashboardController();

  const kpis = [
    {
      label: "Total Companies",
      value: fmt(stats?.totalCompanies),
      icon: Building2,
      tone: "primary" as const,
      hint: "Registered on platform",
    },
    {
      label: "Total Categories",
      value: fmt(stats?.totalCategories),
      icon: Tag,
      tone: "info" as const,
      hint: "Service categories",
    },
    {
      label: "Submitted Requests",
      value: fmt(stats?.totalSubmittedRequests),
      icon: FileText,
      tone: "accent" as const,
      hint: "Project requests",
    },
    {
      label: "Total RFQs",
      value: fmt(stats?.totalRFQs),
      icon: Radio,
      tone: "warning" as const,
      hint: "Requests for quotation",
    },
    {
      label: "Published Jobs",
      value: fmt(stats?.totalPublishedJobs),
      icon: Briefcase,
      tone: "primary" as const,
      hint: "Live on marketplace",
    },
    {
      label: "Assigned Jobs",
      value: fmt(stats?.totalAssignedJobs),
      icon: Clock,
      tone: "info" as const,
      hint: "Contractor assigned",
    },
    {
      label: "Completed Jobs",
      value: fmt(stats?.totalCompletedJobs),
      icon: CircleCheck,
      tone: "accent" as const,
      hint: "Work finished",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(stats?.totalRevenue),
      icon: DollarSign,
      tone: "primary" as const,
      hint: "Platform revenue",
    },
    {
      label: "Total Commission",
      value: formatCurrency(stats?.totalCommission),
      icon: CreditCard,
      tone: "warning" as const,
      hint: "Commission earned",
    },
    {
      label: "Pending Payments",
      value: fmt(stats?.pendingPayments),
      icon: Wallet,
      tone: "info" as const,
      hint: "Awaiting settlement",
    },
  ];

  return (
    <AppShell
      title="Operations Control Center"
      subtitle="Live view of all Fixora platform activity."
      actions={
        <>
          <Button variant="outline" size="sm"><Download className="w-3.5 h-3.5" />Export</Button>
        </>
      }
    >
      {/* KPI Grid */}
      <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-3 min-[1200px]:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <SkeletonKpi key={i} />)
          : kpis.map((k) => {
              const Icon = k.icon;
              return (
                <Card key={k.label} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg grid place-items-center bg-primary/10 text-primary">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                    {k.value}
                  </div>
                  <div className="text-xs font-medium text-foreground mt-0.5">{k.label}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{k.hint}</div>
                </Card>
              );
            })}
      </div>

      {/* Summary Cards Row */}
      {!isLoading && stats && (
        <div className="mt-6 grid grid-cols-1 min-[1024px]:grid-cols-3 gap-6">
          {/* Jobs Breakdown */}
          <Card className="p-5 min-[1024px]:col-span-2">
            <SectionHeader title="Jobs Overview" hint="Breakdown across all stages" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  title: "Published Jobs",
                  value: stats.totalPublishedJobs,
                  desc: "Live on the marketplace",
                  icon: Briefcase,
                  tone: "primary" as const,
                },
                {
                  title: "Assigned Jobs",
                  value: stats.totalAssignedJobs,
                  desc: "Contractor assigned",
                  icon: Clock,
                  tone: "info" as const,
                },
                {
                  title: "Completed Jobs",
                  value: stats.totalCompletedJobs,
                  desc: "Work finished & closed",
                  icon: CircleCheck,
                  tone: "accent" as const,
                },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className="rounded-lg border border-border p-4 bg-surface-muted/40">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-md bg-card border border-border grid place-items-center text-primary">
                        <Icon className="w-4 h-4" />
                      </div>
                      <Pill tone={c.tone}>{c.value.toLocaleString()}</Pill>
                    </div>
                    <div className="mt-3 text-sm font-semibold">{c.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{c.desc}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Financials Summary */}
          <Card className="p-5">
            <SectionHeader title="Financial Summary" hint="Platform revenue & commissions" />
            <ul className="space-y-3">
              {[
                { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, tone: "primary" as const },
                { label: "Total Commission", value: formatCurrency(stats.totalCommission), icon: CreditCard, tone: "warning" as const },
                { label: "Pending Payments", value: fmt(stats.pendingPayments), icon: Wallet, tone: "info" as const },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="w-8 h-8 rounded-md grid place-items-center bg-secondary text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{item.label}</div>
                    </div>
                    <Pill tone={item.tone}>{item.value}</Pill>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
