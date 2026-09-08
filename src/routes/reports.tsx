import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, SectionHeader, Pill, Button } from "@/components/app-shell";
import { useReportsController } from "../hooks/useReportsController";
import { Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — Fixora Admin" },
      {
        name: "description",
        content:
          "Marketplace analytics on RFQ throughput, conversion, commission and category mix.",
      },
      { property: "og:title", content: "Reports & Analytics — Fixora Admin" },
      {
        property: "og:description",
        content:
          "Marketplace analytics on RFQ throughput, conversion, commission and category mix.",
      },
    ],
  }),
  component: Reports,
});

const defaultBars = [42, 55, 48, 66, 71, 58, 74, 88, 82, 95, 101, 118];
const defaultMonths = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

function Reports() {
  const {
    dashboardData,
    monthlyRfqData,
    categoryMixData,
    regionalPerformanceData,
    isExporting,
    handleExport,
  } = useReportsController();

  const rfqThroughput = dashboardData?.rfqThroughput ?? 1284;
  const rfqGrowth = dashboardData?.rfqGrowthPercentage !== undefined
    ? `${dashboardData.rfqGrowthPercentage >= 0 ? "+" : ""}${dashboardData.rfqGrowthPercentage}%`
    : "+18.4%";

  const quotationRate = dashboardData?.quotationRate !== undefined
    ? `${dashboardData.quotationRate}%`
    : "72%";
  const quotationRateGrowth = dashboardData?.quotationRateGrowth !== undefined
    ? `${dashboardData.quotationRateGrowth >= 0 ? "+" : ""}${dashboardData.quotationRateGrowth}pp`
    : "+3.1pp";

  const awardConversion = dashboardData?.awardConversion !== undefined
    ? `${dashboardData.awardConversion}%`
    : "58%";
  const awardGrowth = dashboardData?.awardGrowth !== undefined
    ? `${dashboardData.awardGrowth >= 0 ? "+" : ""}${dashboardData.awardGrowth}pp`
    : "+2.4pp";

  const averageCommission = dashboardData?.averageCommission !== undefined
    ? `${dashboardData.averageCommission}%`
    : "8.0%";
  const commissionStatus = dashboardData?.commissionStatus || "Stable";

  const bars = monthlyRfqData && monthlyRfqData.length > 0
    ? monthlyRfqData.map((m) => m.count)
    : defaultBars;
  const months = monthlyRfqData && monthlyRfqData.length > 0
    ? monthlyRfqData.map((m) => m.month)
    : defaultMonths;
  const max = Math.max(...bars, 1);

  const categoryMix = categoryMixData && categoryMixData.length > 0
    ? categoryMixData.map((c) => ({ l: c.category, v: c.percentage }))
    : [
        { l: "Facilities", v: 32 },
        { l: "Electrical", v: 24 },
        { l: "HVAC", v: 18 },
        { l: "Compliance", v: 14 },
        { l: "Grounds", v: 8 },
        { l: "Security", v: 4 },
      ];

  const regionalPerf = regionalPerformanceData && regionalPerformanceData.length > 0
    ? regionalPerformanceData.map((r) => ({ r: r.region, v: r.awards, status: r.status }))
    : [
        { r: "London", v: 128, status: "Top" },
        { r: "Manchester", v: 92, status: "Top" },
        { r: "Leeds", v: 74, status: "Steady" },
        { r: "Birmingham", v: 61, status: "Steady" },
        { r: "Glasgow", v: 48, status: "Steady" },
        { r: "Bristol", v: 36, status: "Steady" },
      ];

  return (
    <AppShell
      title="Reports & Analytics"
      subtitle="Marketplace volume, category breakdowns and regional performance."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            disabled={isExporting}
            onClick={() => handleExport("csv")}
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export Report
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[1024px]:grid-cols-4 gap-4">
        {[
          { l: "RFQ Throughput", v: typeof rfqThroughput === "number" ? rfqThroughput.toLocaleString() : rfqThroughput, d: rfqGrowth },
          { l: "Quotation Rate", v: quotationRate, d: quotationRateGrowth },
          { l: "Award Conversion", v: awardConversion, d: awardGrowth },
          { l: "Avg. Commission", v: averageCommission, d: commissionStatus },
        ].map((k) => (
          <Card key={k.l} className="p-4">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className="text-2xl font-semibold mt-1 tabular-nums">{k.v}</div>
            <Pill tone="success">{k.d}</Pill>
          </Card>
        ))}
      </div>

      <Card className="p-5 mt-6">
        <SectionHeader
          title="RFQ volume — trailing 12 months"
          hint="Requests submitted per month"
        />
        <div className="flex items-end gap-2 h-56">
          {bars.map((b, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-md bg-primary/85 hover:bg-primary transition-colors"
                style={{ height: `${(b / max) * 100}%` }}
              />
              <span className="text-[11px] text-muted-foreground">{months[i]}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-5">
          <SectionHeader title="Category mix" hint="Share of RFQ value" />
          {categoryMix.map((c) => (
            <div key={c.l} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1">
                <span>{c.l}</span>
                <span className="font-medium">{c.v}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(c.v * 3, 100)}%` }} />
              </div>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <SectionHeader title="Regional performance" hint="Awards issued per region" />
          {regionalPerf.map((r, i) => (
            <div
              key={r.r}
              className="flex items-center gap-3 py-2 border-b last:border-b-0 border-border"
            >
              <span className="w-6 text-xs text-muted-foreground tabular-nums">#{i + 1}</span>
              <span className="flex-1 text-sm">{r.r}</span>
              <span className="text-sm font-semibold tabular-nums">{r.v}</span>
              <Pill tone={r.status === "Top" || i < 2 ? "success" : "muted"}>{r.status || (i < 2 ? "Top" : "Steady")}</Pill>
            </div>
          ))}
        </Card>
      </div>
    </AppShell>
  );
}

