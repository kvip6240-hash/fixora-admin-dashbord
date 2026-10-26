import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, CalendarDays, Loader2, MapPin, Paperclip, User } from "lucide-react";
import { AppShell, Button, Card } from "@/components/app-shell";
import { AttachmentItem } from "@/components/dashboard/AttachmentItem";
import { fetchProjectRequestById } from "@/lib/api";

export const Route = createFileRoute("/admin/requests/$requestId/visiting-schedule")({
  component: VisitingSchedulePage,
});

function value(input: unknown) {
  return typeof input === "string" || typeof input === "number" ? String(input) : "Not provided";
}

function hasValue(input: unknown) {
  return typeof input === "string" ? input.trim().length > 0 : typeof input === "number";
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-800">{children}</div>
    </div>
  );
}

function VisitingSchedulePage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["project-request", requestId],
    queryFn: () => fetchProjectRequestById(requestId),
    enabled: Boolean(requestId),
  });

  const request = ((data as any)?.data ?? (data as any)?.project ?? data) as
    Record<string, any> | undefined;
  const requester = (request?.requesterId ?? request?.requester ?? {}) as Record<string, unknown>;
  const category =
    request?.categoryId?.name ?? request?.category?.name ?? request?.category ?? request?.service;
  const location = request?.location;
  const locationText =
    typeof location === "string"
      ? location
      : (location?.address ?? request?.address ?? request?.siteAddress ?? request?.siteName);
  const attachments = Array.isArray(request?.attachments) ? request.attachments : [];

  if (isLoading) {
    return (
      <AppShell title="Visiting Schedule">
        <div className="flex h-64 items-center justify-center text-slate-500">
          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          Loading request details…
        </div>
      </AppShell>
    );
  }

  if (isError || !request) {
    const message = error instanceof Error ? error.message : "Unable to load this request.";
    return (
      <AppShell title="Visiting Schedule" subtitle="Request details are unavailable.">
        <Card className="mx-auto max-w-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-slate-900">Unable to load request details</h2>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          <Button className="mt-5" variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Card>
      </AppShell>
    );
  }

  const requesterName =
    requester.name ?? requester.fullName ?? requester.companyName ?? request.requesterName;
  const requesterEmail = requester.email ?? request.requesterEmail;
  const requesterPhone = requester.phone ?? request.requesterPhone;
  const requesterCompany = requester.companyName ?? request.companyName;

  return (
    <AppShell
      title="Visiting Schedule"
      subtitle="Review the requester and service details before requesting a visiting schedule."
      actions={
        <Button variant="outline" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="border-teal-100 bg-gradient-to-r from-teal-50 to-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Project Request
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                {value(request.title ?? request.projectName ?? request.name)}
              </h2>
            </div>
            {request.requestNumber && (
              <p className="rounded-md bg-white px-3 py-1.5 font-mono text-sm font-semibold text-slate-700 shadow-sm">
                {value(request.requestNumber)}
              </p>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <User className="h-5 w-5 text-teal-700" />
              Requester Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {hasValue(requesterName) && (
                <Field label="Requester Name">{value(requesterName)}</Field>
              )}
              {hasValue(requesterEmail) && <Field label="Email">{value(requesterEmail)}</Field>}
              {hasValue(requesterPhone) && <Field label="Phone">{value(requesterPhone)}</Field>}
              {hasValue(requesterCompany) && (
                <Field label="Company">{value(requesterCompany)}</Field>
              )}
              {![requesterName, requesterEmail, requesterPhone, requesterCompany].some(
                hasValue,
              ) && (
                <p className="text-sm text-slate-600">
                  Requester information is not available for this request.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <Building2 className="h-5 w-5 text-teal-700" />
              Service Request
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {hasValue(category) && <Field label="Service Category">{value(category)}</Field>}
              {hasValue(request.status) && (
                <Field label="Request Status">{value(request.status)}</Field>
              )}
              {hasValue(request.description) && (
                <div className="sm:col-span-2">
                  <Field label="Description">
                    <p className="whitespace-pre-wrap font-normal text-slate-700">
                      {value(request.description)}
                    </p>
                  </Field>
                </div>
              )}
              {![category, request.status, request.description].some(hasValue) && (
                <p className="text-sm text-slate-600">Service request details are not available.</p>
              )}
            </div>
          </Card>
        </div>

        {locationText && (
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <MapPin className="h-5 w-5 text-teal-700" />
              Request Location
            </h2>
            <p className="text-sm text-slate-700">{value(locationText)}</p>
          </Card>
        )}

        {attachments.length > 0 && (
          <Card className="p-6">
            <h2 className="mb-4 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
              <Paperclip className="h-5 w-5 text-teal-700" />
              Attachments
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {attachments.map((attachment: any, index: number) => (
                <AttachmentItem key={index} attachment={attachment} index={index} />
              ))}
            </div>
          </Card>
        )}

        <Card className="border-amber-200 bg-amber-50/60 p-6">
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2 className="font-semibold text-amber-900">
                Schedule request workflow unavailable
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                The current admin frontend has no existing authenticated endpoint for sending a
                visiting-schedule request. This page can safely review the selected request, but
                cannot submit a request until the backend provides that workflow.
              </p>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              disabled
              title="A schedule-request API endpoint is required before this action can be enabled."
            >
              <CalendarDays className="h-4 w-4" />
              Send Schedule Request
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
