import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronDown,
  Download,
  FileCheck,
  FileText,
  Loader2,
  User,
} from "lucide-react";
import { AppShell, Button, Card } from "@/components/app-shell";
import { fetchAdminRfqDetails } from "@/lib/api";
import { CopyRequestId } from "@/components/CopyRequestId";
import { downloadRfqData, type RfqDownloadFormat } from "@/lib/rfq-download";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/requests/$requestId/rfq")({
  component: RfqDetailsPage,
});

function formatDateTime(value?: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not provided"
    : date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

function formatMoney(value?: number | null, currency?: string | null) {
  if (value === undefined || value === null) return "Not provided";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
    }).format(value);
  } catch {
    return `${currency || ""} ${value}`.trim();
  }
}

function Field({
  label,
  value,
  className = "",
  valueClassName = "",
}: {
  label: string;
  value?: string | null;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-medium text-slate-800 ${valueClassName}`}>
        {value || "Not provided"}
      </p>
    </div>
  );
}

function RfqDetailsPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState<RfqDownloadFormat | null>(null);
  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-rfq-details", requestId],
    queryFn: () => fetchAdminRfqDetails(requestId),
    enabled: !!requestId,
  });
  const rfq = response?.data;
  const backToRequest = () =>
    navigate({ to: "/admin/bookings/$bookingId", params: { bookingId: requestId } });

  if (isLoading)
    return (
      <AppShell title="RFQ Details">
        <div className="flex h-64 items-center justify-center text-slate-500">
          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          Loading RFQ…
        </div>
      </AppShell>
    );

  if (isError || !rfq) {
    const message = error instanceof Error ? error.message : "Unable to load the RFQ.";
    return (
      <AppShell title="RFQ Details" subtitle="The requested RFQ is unavailable.">
        <Card className="mx-auto max-w-xl p-6 text-center">
          <FileCheck className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">Unable to load RFQ</h2>
          <p className="mt-1 text-sm text-slate-600">{message}</p>
          <Button className="mt-5" variant="outline" onClick={backToRequest}>
            <ArrowLeft className="h-4 w-4" />
            Back to Request
          </Button>
        </Card>
      </AppShell>
    );
  }

  const project = rfq.projectRequestId;
  const requester = rfq.requesterId;
  const providerName = project?.assignedProvider?.companyName || project?.assignedProvider?.name;
  const download = async (format: RfqDownloadFormat) => {
    setDownloading(format);
    try {
      downloadRfqData(rfq, format);
      toast.success("RFQ download started.");
    } catch (downloadError: unknown) {
      toast.error(
        downloadError instanceof Error ? downloadError.message : "Unable to generate the download.",
      );
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AppShell
      title="RFQ Details"
      subtitle="Prepared quotation sent to the requester"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={backToRequest}>
            <ArrowLeft className="h-4 w-4" />
            Back to Request
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="primary" size="sm" disabled={downloading !== null}>
                <Download className="h-4 w-4" />
                {downloading ? "Generating…" : "Download"}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem onSelect={() => download("invoice-pdf")}>
                Download Invoice PDF
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => download("rfq-pdf")}>
                Download RFQ PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => download("excel")}>
                Download RFQ Data - Excel
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => download("csv")}>
                Download RFQ Data - CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="border-teal-100 bg-gradient-to-r from-teal-50 to-white p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-teal-700 p-2.5 text-white">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  Request for quotation
                </p>
                <span className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {rfq.status || "Not provided"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <Field label="RFQ Number" value={rfq.rfqNumber} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Request Number
                </p>
                <CopyRequestId
                  requestNumber={project?.requestNumber}
                  className="mt-1 font-mono text-sm font-semibold text-slate-800"
                />
              </div>
              <Field label="Created Date" value={formatDateTime(rfq.createdAt)} />
              <Field label="Sent Date" value={formatDateTime(rfq.sentAt)} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <User className="h-5 w-5 text-teal-700" />
              Requester Information
            </h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)]">
              <Field label="Company Name" value={requester?.companyName} />
              <Field label="Email" value={requester?.email} valueClassName="break-all" />
              <Field label="Phone" value={requester?.phone} />
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <Building2 className="h-5 w-5 text-teal-700" />
              Service Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Service Category" value={project?.categoryId?.name} />
              <Field label="Assigned Provider" value={providerName} />
              <Field label="Project Request Status" value={project?.status} />
              <Field label="RFQ Status" value={rfq.status} />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
            <FileText className="h-5 w-5 text-teal-700" />
            Project Information
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Project Title" value={project?.title} />
            <Field label="Description" value={project?.description} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
            <FileCheck className="h-5 w-5 text-teal-700" />
            RFQ / Quotation
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Amount" value={formatMoney(rfq.amount, rfq.currency)} />
            <Field label="Currency" value={rfq.currency} />
            <Field label="Hourly Rate" value={formatMoney(rfq.hourlyRate, rfq.currency)} />
            <Field label="Labour Cost" value={formatMoney(rfq.labourCost, rfq.currency)} />
            <Field label="Material Cost" value={formatMoney(rfq.materialCost, rfq.currency)} />
            <Field label="Service Charge" value={formatMoney(rfq.serviceCharge, rfq.currency)} />
            <Field label="Tax" value={formatMoney(rfq.tax, rfq.currency)} />
            <Field label="Discount" value={formatMoney(rfq.discount, rfq.currency)} />
            <div className="rounded-lg bg-teal-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Final Total
              </p>
              <p className="mt-1 text-lg font-bold text-teal-800">
                {formatMoney(rfq.amount, rfq.currency)}
              </p>
            </div>
            <Field label="Estimated Duration" value={rfq.estimatedDuration} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Remarks" value={rfq.remarks} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
            <CalendarDays className="h-5 w-5 text-teal-700" />
            RFQ Timeline
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Prepared" value={formatDateTime(rfq.createdAt)} />
            <Field label="Sent to Requester" value={formatDateTime(rfq.sentAt)} />
            <Field label="Last Updated" value={formatDateTime(rfq.updatedAt)} />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
