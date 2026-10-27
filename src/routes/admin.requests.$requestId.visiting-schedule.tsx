import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, CalendarDays, Loader2, MapPin, Paperclip, User } from "lucide-react";
import { AppShell, Button, Card } from "@/components/app-shell";
import { AttachmentItem } from "@/components/dashboard/AttachmentItem";
import { ApiError, fetchAdminRfqDetails, fetchProjectRequestById, sendVisitingScheduleRequest } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/requests/$requestId/visiting-schedule")({
  component: VisitingSchedulePage,
});

function value(input: unknown) {
  return typeof input === "string" || typeof input === "number" ? String(input) : "Not provided";
}

function hasValue(input: unknown) {
  return typeof input === "string" ? input.trim().length > 0 : typeof input === "number";
}

function formatDateTime(input?: string | null) {
  if (!input) return "Not provided";
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? "Not provided" : date.toLocaleString();
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
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["project-request", requestId],
    queryFn: () => fetchProjectRequestById(requestId),
    enabled: Boolean(requestId),
  });

  const request = ((data as any)?.data ?? (data as any)?.project ?? data) as
    Record<string, any> | undefined;
  const rfqQuery = useQuery({
    queryKey: ["admin-rfq-details", requestId],
    queryFn: () => fetchAdminRfqDetails(requestId),
    enabled: Boolean(requestId && request),
  });
  const rfq = rfqQuery.data?.data as (Record<string, any> & { _id?: string }) | undefined;
  const sendMutation = useMutation({
    mutationFn: () => {
      if (!rfq?._id) throw new Error("The RFQ ID is missing; the schedule request was not sent.");
      return sendVisitingScheduleRequest(rfq._id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-rfq-details", requestId] });
      toast.success("Visiting schedule request sent.");
    },
    onError: async (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.invalidateQueries({ queryKey: ["admin-rfq-details", requestId] });
        toast.info("A visiting schedule request was already sent. Status refreshed.");
      } else {
        toast.error(error instanceof Error ? error.message : "Unable to send the schedule request.");
      }
    },
  });
  const requester = (request?.requesterId ?? request?.requester ?? {}) as Record<string, unknown>;
  const category =
    request?.categoryId?.name ?? request?.category?.name ?? request?.category ?? request?.service;
  const location = request?.location;
  const locationText =
    typeof location === "string"
      ? location
      : (location?.address ?? request?.address ?? request?.siteAddress ?? request?.siteName);
  const attachments = Array.isArray(request?.attachments) ? request.attachments : [];
  const scheduleRequest = rfq?.visitingScheduleRequest ?? rfq?.scheduleRequest;
  const requestStatus = String(rfq?.visitingScheduleRequestStatus ?? rfq?.scheduleRequestStatus ?? scheduleRequest?.status ?? "").toLowerCase();
  const requestSentAt = rfq?.visitingScheduleRequestedAt ?? rfq?.visitingScheduleRequestSentAt ?? rfq?.scheduleRequestSentAt ?? scheduleRequest?.sentAt ?? scheduleRequest?.requestedAt;
  const responseStatus = String(rfq?.visitingScheduleResponseStatus ?? rfq?.requesterVisitingSchedule?.responseStatus ?? "").toLowerCase();
  const hasSentRequest = Boolean(requestSentAt || requestStatus === "sent" || responseStatus === "submitted");
  const rfqLoadMessage = rfqQuery.error instanceof ApiError && rfqQuery.error.status === 404
    ? "No RFQ is linked to this project request yet. Prepare the quotation first; a Visiting Schedule request can only be sent for an existing RFQ."
    : rfqQuery.error instanceof ApiError && [401, 403].includes(rfqQuery.error.status)
      ? "You are not authorized to load this RFQ. Sign in with an admin account and try again."
      : rfqQuery.error instanceof Error
        ? rfqQuery.error.message
        : "Unable to load RFQ details.";

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
      {rfqQuery.isError && <Card className="mx-auto max-w-6xl border-red-200 bg-red-50 p-4 text-sm text-red-800">{rfqLoadMessage}</Card>}
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

        <Card className="border-teal-100 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Visiting Schedule Request Status</h2>
              <p className="mt-1 text-sm text-slate-600">
                {rfqQuery.isLoading ? "Checking saved RFQ status…" : !rfq ? "Unavailable" : responseStatus === "submitted" ? "Response received" : hasSentRequest ? "Request sent · awaiting requester response" : "Not sent"}
              </p>
              {requestSentAt && <p className="mt-1 text-xs text-slate-500">Sent {formatDateTime(requestSentAt)}</p>}
            </div>
            <Button
              disabled={sendMutation.isPending || hasSentRequest || !rfq?._id || rfqQuery.isLoading || rfqQuery.isError}
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
              {sendMutation.isPending ? "Sending…" : hasSentRequest ? "Schedule Request Sent" : "Send Schedule Request"}
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
