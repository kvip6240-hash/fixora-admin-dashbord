import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button, SectionHeader } from "@/components/app-shell";
import { ArrowUpRight, Wallet, Receipt, Landmark, Percent } from "lucide-react";
import { usePaymentsController } from "../hooks/usePaymentsController";
import { useState } from "react";
import { toast } from "sonner";
import { exportAdminCsv } from "@/lib/api";
import { downloadBlob } from "@/lib/download";

export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Quotalink" },
      {
        name: "description",
        content:
          "Client invoices, commission earnings and provider payouts across the marketplace.",
      },
      { property: "og:title", content: "Payments — Quotalink" },
      {
        property: "og:description",
        content:
          "Client invoices, commission earnings and provider payouts across the marketplace.",
      },
    ],
  }),
  component: Payments,
});

const clientPending = [
  {
    inv: "INV-9014",
    requester: "Whitmore Retail Group",
    project: "HVAC quarterly",
    amount: "£42,000",
    due: "24 Jul",
    status: "Awaiting",
  },
  {
    inv: "INV-9013",
    requester: "Meridian Financial",
    project: "CCTV upgrade",
    amount: "£18,200",
    due: "25 Jul",
    status: "Awaiting",
  },
  {
    inv: "INV-9012",
    requester: "Kingsford Manufacturing",
    project: "Rewiring — Warehouse B",
    amount: "£61,400",
    due: "26 Jul",
    status: "Overdue",
  },
];
const payouts = [
  {
    id: "PO-4501",
    provider: "Bramwell Facilities Ltd",
    gross: "£61,400",
    commission: "£4,912",
    net: "£56,488",
    bank: "Barclays ••7712",
    status: "Ready",
  },
  {
    id: "PO-4500",
    provider: "Silverline Contracts",
    gross: "£18,200",
    commission: "£1,456",
    net: "£16,744",
    bank: "HSBC ••3391",
    status: "Ready",
  },
  {
    id: "PO-4499",
    provider: "NorthEdge Services",
    gross: "£8,400",
    commission: "£672",
    net: "£7,728",
    bank: "Lloyds ••0028",
    status: "Processing",
  },
];
const transactions = [
  {
    ref: "TX-77812",
    type: "Client payment",
    party: "Ashbury Property Trust",
    amount: "+£33,900",
    date: "22 Jul, 09:14",
  },
  {
    ref: "TX-77811",
    type: "Provider payout",
    party: "Clyde & Ross Mechanical",
    amount: "−£31,188",
    date: "22 Jul, 09:15",
  },
  {
    ref: "TX-77810",
    type: "Commission",
    party: "Platform",
    amount: "+£2,712",
    date: "22 Jul, 09:15",
  },
  {
    ref: "TX-77809",
    type: "Client payment",
    party: "Whitmore Retail Group",
    amount: "+£52,600",
    date: "21 Jul, 16:02",
  },
  {
    ref: "TX-77808",
    type: "Refund",
    party: "Coleridge Hospitality",
    amount: "−£1,200",
    date: "21 Jul, 11:44",
  },
];

function Payments() {
  const controller = usePaymentsController();
  const [isExporting, setIsExporting] = useState(false);

  const exportPayments = async () => {
    setIsExporting(true);
    try {
      const { blob, filename } = await exportAdminCsv("payments");
      downloadBlob(blob, filename);
      toast.success("Payment statement exported successfully.");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Payment statement export is not available yet.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell
      title="Payments"
      subtitle="End-to-end money movement from requester to provider, with automatic commission."
      actions={
        <Button variant="outline" size="sm" onClick={exportPayments} disabled={isExporting}>
          <Receipt className="w-3.5 h-3.5" />
          {isExporting ? "Exporting…" : "Download statement"}
        </Button>
      }
    >
      <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[900px]:grid-cols-4 gap-4">
        {[
          {
            label: "Pending Client Payments",
            value: "£121,600",
            hint: "11 invoices",
            icon: Landmark,
            tone: "warning" as const,
          },
          {
            label: "Commission Earned (MTD)",
            value: "£38,412",
            hint: "+14.2%",
            icon: Percent,
            tone: "primary" as const,
          },
          {
            label: "Provider Payout Queue",
            value: "£184,220",
            hint: "14 payouts",
            icon: Wallet,
            tone: "info" as const,
          },
          {
            label: "Platform Revenue (YTD)",
            value: "£1.42m",
            hint: "+22.4%",
            icon: ArrowUpRight,
            tone: "success" as const,
          },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                  <Icon className="w-4 h-4" />
                </div>
                <Pill tone={k.tone}>{k.hint}</Pill>
              </div>
              <div className="mt-3 text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 min-[1200px]:grid-cols-2 gap-4 mt-6">
        <Card>
          <div className="p-5 pb-3">
            <SectionHeader
              title="Pending client payments"
              hint="Awaiting settlement from requesters"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 border-y border-border text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Invoice</th>
                  <th className="px-3 py-2.5 text-left font-medium">Requester</th>
                  <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                  <th className="px-3 py-2.5 text-left font-medium">Due</th>
                  <th className="px-5 py-2.5 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientPending.map((r) => (
                  <tr key={r.inv} className="hover:bg-secondary/40">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-muted-foreground">{r.inv}</div>
                      <div className="text-xs">{r.project}</div>
                    </td>
                    <td className="px-3 py-3">{r.requester}</td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{r.amount}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.due}</td>
                    <td className="px-5 py-3 text-right">
                      <Pill tone={r.status === "Overdue" ? "destructive" : "warning"}>
                        {r.status}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="p-5 pb-3">
            <SectionHeader
              title="Provider payout queue"
              hint="Net of platform commission"
              action={<Button size="sm">Release ready</Button>}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 border-y border-border text-[11px] uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 text-left font-medium">Payout</th>
                  <th className="px-3 py-2.5 text-right font-medium">Gross</th>
                  <th className="px-3 py-2.5 text-right font-medium">Commission</th>
                  <th className="px-3 py-2.5 text-right font-medium">Net</th>
                  <th className="px-5 py-2.5 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/40">
                    <td className="px-5 py-3">
                      <div className="font-mono text-xs text-muted-foreground">{p.id}</div>
                      <div className="text-sm font-medium">{p.provider}</div>
                      <div className="text-[11px] text-muted-foreground">{p.bank}</div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{p.gross}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-primary">
                      −{p.commission}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{p.net}</td>
                    <td className="px-5 py-3 text-right">
                      <Pill tone={p.status === "Ready" ? "success" : "info"}>{p.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="p-5 pb-3">
          <SectionHeader title="Transaction history" hint="Every money movement, ledger-style" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 border-y border-border text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Ref</th>
                <th className="px-3 py-2.5 text-left font-medium">Type</th>
                <th className="px-3 py-2.5 text-left font-medium">Party</th>
                <th className="px-3 py-2.5 text-right font-medium">Amount</th>
                <th className="px-5 py-2.5 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t) => (
                <tr key={t.ref} className="hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs">{t.ref}</td>
                  <td className="px-3 py-3">{t.type}</td>
                  <td className="px-3 py-3">{t.party}</td>
                  <td
                    className={`px-3 py-3 text-right font-semibold tabular-nums ${t.amount.startsWith("+") ? "text-[oklch(0.55_0.14_155)]" : "text-destructive"}`}
                  >
                    {t.amount}
                  </td>
                  <td className="px-5 py-3 text-right text-muted-foreground">{t.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
