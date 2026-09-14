import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  FileCheck,
  FileText,
  Loader2,
  MapPin,
  User,
} from "lucide-react";
import { AppShell, Button, Card } from "@/components/app-shell";
import { fetchBookingDetails, type BookingDetails } from "@/lib/api";
import { CopyRequestId } from "@/components/CopyRequestId";

export const Route = createFileRoute("/admin/requests/$requestId/rfq")({
  component: RfqDetailsPage,
});

type RecordData = Record<string, unknown>;

function asRecord(value: unknown): RecordData {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordData) : {};
}

function firstString(...values: unknown[]): string | undefined {
  return values
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)
    ?.trim();
}

function firstNumber(...values: unknown[]): number | undefined {
  return values.find(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
}

function formatDateTime(value: unknown) {
  if (typeof value !== "string" || !value) return "Not provided";
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

function formatMoney(value: number | undefined, currency: string | undefined) {
  if (value === undefined) return "Not provided";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
    }).format(value);
  } catch {
    return `${currency || ""} ${value}`.trim();
  }
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || "Not provided"}</p>
    </div>
  );
}

function RfqDetailsPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["booking-details", requestId],
    queryFn: () => fetchBookingDetails(requestId),
    enabled: !!requestId,
  });
  const booking = data?.data;

  if (isLoading) {
    return (
      <AppShell title="RFQ Details">
        <div className="flex h-64 items-center justify-center text-slate-500">
          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          Loading RFQ…
        </div>
      </AppShell>
    );
  }

  if (isError || !booking || booking.status !== "RFQ") {
    return (
      <AppShell title="RFQ Details" subtitle="The requested RFQ is unavailable.">
        <Card className="mx-auto max-w-xl p-6 text-center">
          <FileCheck className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-3 text-lg font-semibold text-slate-900">RFQ not available</h2>
          <p className="mt-1 text-sm text-slate-600">
            This request does not currently have a sent RFQ to display.
          </p>
          <Button
            className="mt-5"
            variant="outline"
            onClick={() =>
              navigate({ to: "/admin/bookings/$bookingId", params: { bookingId: requestId } })
            }
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Request
          </Button>
        </Card>
      </AppShell>
    );
  }

  // The booking detail endpoint is the existing source of the RFQ sent by the prepare flow.
  // Prefer its nested RFQ/quotation object when available; fall back only to fields returned on this same record.
  const source = booking as BookingDetails & RecordData;
  const rfq = asRecord(
    source.rfq ?? source.quotation ?? source.preparedQuotation ?? source.quotationDetails,
  );
  const requester = asRecord(source.requesterId);
  const category = asRecord(source.categoryId);
  const location = asRecord(source.location);
  const schedule = asRecord(source.schedule);
  const currency = firstString(rfq.currency, source.currency);
  const amount = firstNumber(
    rfq.amount,
    rfq.finalTotal,
    rfq.total,
    source.amount,
    source.quotedAmount,
    source.finalTotal,
  );
  const labour = firstNumber(rfq.labourCost, source.labourCost);
  const material = firstNumber(rfq.materialCost, source.materialCost);
  const serviceCharge = firstNumber(rfq.serviceCharge, source.serviceCharge);
  const tax = firstNumber(rfq.tax, source.tax);
  const gst = firstNumber(rfq.gst, source.gst);
  const discount = firstNumber(rfq.discount, source.discount);
  const subtotal = firstNumber(rfq.subtotal, source.subtotal);
  const requestNumber = firstString(source.requestNumber);
  const rfqNumber = firstString(rfq.rfqNumber, rfq.number, source.rfqNumber);
  const responseStatus =
    firstString(
      rfq.status,
      rfq.responseStatus,
      source.rfqStatus,
      source.quotationStatus,
      source.status,
    ) || "Waiting for Requester Response";
  const sentAt =
    rfq.sentAt ?? rfq.sentDate ?? source.rfqSentAt ?? source.quotationSentAt ?? source.updatedAt;

  return (
    <AppShell
      title="RFQ Details"
      subtitle="Prepared quotation sent to the requester"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            navigate({ to: "/admin/bookings/$bookingId", params: { bookingId: requestId } })
          }
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Request
        </Button>
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
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    {responseStatus}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <Field label="RFQ Number" value={rfqNumber} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Request Number
                </p>
                <CopyRequestId
                  requestNumber={requestNumber}
                  className="mt-1 font-mono text-sm font-semibold text-slate-800"
                />
              </div>
              <Field label="Created" value={formatDateTime(rfq.createdAt ?? source.createdAt)} />
              <Field label="Sent" value={formatDateTime(sentAt)} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <User className="h-5 w-5 text-teal-700" />
              Requester Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Customer Name"
                value={firstString(requester.name, requester.fullName, source.requesterName)}
              />
              <Field
                label="Company Name"
                value={firstString(requester.companyName, source.companyName)}
              />
              <Field label="Email" value={firstString(requester.email, source.requesterEmail)} />
              <Field label="Phone" value={firstString(requester.phone, source.requesterPhone)} />
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <CalendarDays className="h-5 w-5 text-teal-700" />
              Service & Schedule
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Service Category"
                value={firstString(category.name, source.categoryName, source.service)}
              />
              <Field label="Service Name" value={firstString(source.serviceName, source.service)} />
              <Field
                label="Preferred Date"
                value={firstString(schedule.preferredDate, source.preferredDate)}
              />
              <Field
                label="Preferred Time"
                value={firstString(schedule.serviceTime, source.serviceTime)}
              />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
            <FileText className="h-5 w-5 text-teal-700" />
            Project Information
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Project Title" value={firstString(source.title)} />
            <Field label="Priority" value={firstString(source.priority)} />
            <div className="sm:col-span-3">
              <Field label="Description" value={firstString(source.description)} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <FileCheck className="h-5 w-5 text-teal-700" />
              RFQ / Quotation
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Labour Cost" value={formatMoney(labour, currency)} />
              <Field label="Material Cost" value={formatMoney(material, currency)} />
              <Field label="Service Charge" value={formatMoney(serviceCharge, currency)} />
              <Field label="Subtotal" value={formatMoney(subtotal, currency)} />
              <Field label="Tax" value={formatMoney(tax, currency)} />
              <Field label="GST" value={formatMoney(gst, currency)} />
              <Field label="Discount" value={formatMoney(discount, currency)} />
              <Field label="Currency" value={currency} />
              <div className="rounded-lg bg-teal-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  Final Total
                </p>
                <p className="mt-1 text-lg font-bold text-teal-800">
                  {formatMoney(amount, currency)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <Clock className="h-5 w-5 text-teal-700" />
              Duration & Location
            </h2>
            <div className="space-y-4">
              <Field
                label="Estimated Duration"
                value={firstString(
                  rfq.estimatedDuration,
                  source.estimatedDuration,
                  schedule.estimatedDuration,
                )}
              />
              <Field
                label="Address"
                value={firstString(
                  location.address,
                  source.address,
                  typeof source.location === "string" ? source.location : undefined,
                )}
              />
              <Field label="City" value={firstString(location.city, source.city)} />
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
