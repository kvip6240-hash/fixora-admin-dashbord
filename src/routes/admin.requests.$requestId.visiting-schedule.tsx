import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  Paperclip,
  RefreshCw,
  User,
} from "lucide-react";
import { AppShell, Button, Card } from "@/components/app-shell";
import { AttachmentItem } from "@/components/dashboard/AttachmentItem";
import {
  ApiError,
  fetchAdminRfqDetails,
  fetchProjectRequestById,
  sendVisitingScheduleRequest,
  type AdminRfqDetails,
  type Attachment,
} from "@/lib/api";
import { toast } from "sonner";
import type { ReactNode } from "react";

export const Route = createFileRoute("/admin/requests/$requestId/visiting-schedule")({
  component: VisitingSchedulePage,
});

type DataRecord = Record<string, unknown>;

function record(value: unknown): DataRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as DataRecord)
    : undefined;
}

function display(value: unknown, fallback = "Not available"): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function present(value: unknown): boolean {
  return (typeof value === "string" && value.trim().length > 0) || typeof value === "number";
}

function formatDateTime(value?: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleString();
}

function field(label: string, value: unknown, className = "") {
  if (!present(value)) return null;
  return (
    <div className={`min-w-0 ${className}`} key={label}>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-800">
        {display(value)}
      </p>
    </div>
  );
}

function readErrorMessage(error: unknown, subject: string): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : `Unable to load ${subject}.`;
  }
  if (error.status === 0) {
    return error.message.includes("within 20 seconds")
      ? `The server did not respond while loading ${subject}. You can retry this read request.`
      : `The backend could not be reached while loading ${subject}. Check the connection and retry.`;
  }
  if (error.status === 401)
    return "Your admin session is no longer authorized. Sign in again, then retry.";
  if (error.status === 403) return "Your account is not authorized to view this information.";
  if (error.status === 404 && subject === "Job status")
    return "No job quotation is linked to this project request yet. Prepare the quotation first; schedule requests require an existing job quotation.";
  if (error.status === 404) return `${subject} was not found.`;
  if (error.status >= 500)
    return `The server could not load ${subject} (${error.status}). Retry in a moment.`;
  return error.message;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-slate-800">{children}</div>
    </div>
  );
}

function VisitingSchedulePage() {
  const { requestId } = Route.useParams();
  const queryClient = useQueryClient();

  // These are independent reads. Start both immediately and avoid the global
  // retry policy here; admins can explicitly retry only the failed read.
  const projectQuery = useQuery({
    queryKey: ["project-request", requestId],
    queryFn: () => fetchProjectRequestById(requestId),
    enabled: Boolean(requestId),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const rfqQuery = useQuery({
    queryKey: ["admin-rfq-details", requestId],
    queryFn: () => fetchAdminRfqDetails(requestId),
    enabled: Boolean(requestId),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // GET /admin/project-requests/:id returns { success, data: { ...detail } }.
  const projectEnvelope = record(projectQuery.data);
  const request = record(projectEnvelope?.data);
  const rfq = rfqQuery.data?.data as AdminRfqDetails | undefined;
  const location = record(request?.location);
  const schedule = record(request?.schedule);
  const company = record(request?.company);
  const attachments = Array.isArray(request?.attachments)
    ? request.attachments.filter(
        (item): item is Attachment =>
          typeof item === "string" || (item !== null && typeof item === "object"),
      )
    : [];

  const requesterSchedule = record(rfq?.requesterVisitingSchedule);
  const requestStatus = String(rfq?.visitingScheduleRequestStatus ?? "").toLowerCase();
  const responseStatus = String(rfq?.visitingScheduleResponseStatus ?? "").toLowerCase();
  const requestSentAt = rfq?.visitingScheduleRequestedAt;
  const requestSentAtText = formatDateTime(requestSentAt);
  const responseSubmittedAt = formatDateTime(requesterSchedule?.submittedAt);
  const hasSentRequest = Boolean(
    requestSentAt || requestStatus === "sent" || responseStatus === "submitted",
  );

  const sendMutation = useMutation({
    mutationFn: () => {
      if (!rfq?._id)
        throw new Error("The linked job quotation could not be verified. The schedule request was not sent.");
      return sendVisitingScheduleRequest(rfq._id);
    },
    onSuccess: async (response) => {
      queryClient.setQueryData(["admin-rfq-details", requestId], (old: typeof rfqQuery.data) => {
        if (!old?.data || !response.data || typeof response.data !== "object") return old;
        return { ...old, data: { ...old.data, ...(response.data as Partial<AdminRfqDetails>) } };
      });
      await rfqQuery.refetch();
      toast.success(response.message || "Visiting schedule request sent.");
    },
    onError: async (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        const refreshed = await rfqQuery.refetch();
        const savedRfq = refreshed.data?.data;
        const savedStatus = String(savedRfq?.visitingScheduleRequestStatus ?? "").toLowerCase();
        if (
          savedRfq &&
          (savedRfq.visitingScheduleRequestedAt ||
            savedStatus === "sent" ||
            String(savedRfq.visitingScheduleResponseStatus ?? "").toLowerCase() === "submitted")
        ) {
          toast.info(
            "This schedule request was already sent. The saved status has been refreshed.",
          );
        } else {
          toast.error(
            "The server reported a duplicate request, but the saved status could not be confirmed. Retry loading the job status.",
          );
        }
      } else {
        toast.error(
          error instanceof Error ? error.message : "Unable to send the schedule request.",
        );
      }
    },
  });

  const requesterName = request?.requesterName;
  const requesterEmail = request?.requesterEmail;
  const requesterPhone = request?.requesterPhone;
  const companyName = request?.companyName ?? company?.companyName;
  const companyEmail = request?.companyEmail ?? company?.email;
  const companyPhone = company?.phone;
  const companyAddress = company?.address;
  const locationParts = [
    location?.siteName,
    location?.address,
    location?.city,
    location?.state,
    location?.pincode,
    location?.country,
  ]
    .filter(present)
    .map((part) => display(part));

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
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Project Request
          </p>
          {projectQuery.isLoading ? (
            <div className="mt-3 flex items-center text-sm text-slate-600">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading project request details…
            </div>
          ) : projectQuery.isError ? (
            <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p role="alert" className="text-sm text-red-700">
                {readErrorMessage(projectQuery.error, "project request details")}
              </p>
              <Button variant="outline" size="sm" onClick={() => void projectQuery.refetch()}>
                <RefreshCw className="h-4 w-4" />
                Retry details
              </Button>
            </div>
          ) : request ? (
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {display(request.projectTitle)}
              </h2>
              <p className="rounded-md bg-white px-3 py-1.5 font-mono text-sm font-semibold text-slate-700 shadow-sm">
                {display(request.requestNumber)}
              </p>
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p role="alert" className="text-sm text-slate-600">
                The project request response did not include its detail record.
              </p>
              <Button variant="outline" size="sm" onClick={() => void projectQuery.refetch()}>
                <RefreshCw className="h-4 w-4" />
                Retry details
              </Button>
            </div>
          )}
        </Card>

        {request && (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h2 className="mb-5 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
                  <User className="h-5 w-5 text-teal-700" />
                  Requester Information
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("Requester Name", requesterName)}
                  {field("Email", requesterEmail)}
                  {field("Phone", requesterPhone)}
                  {field("Company", companyName)}
                  {field("Company Email", companyEmail)}
                  {field("Company Phone", companyPhone)}
                  {field("Company Address", companyAddress)}
                  {![
                    requesterName,
                    requesterEmail,
                    requesterPhone,
                    companyName,
                    companyEmail,
                    companyPhone,
                    companyAddress,
                  ].some(present) && (
                    <p className="text-sm text-slate-600">
                      Requester information is not included in the project request response.
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
                  {field("Service Category", request.category)}
                  {field("Request Status", request.status)}
                  {field("Priority", request.priority)}
                  {field("Title", request.projectTitle)}
                  {field("Description", request.description, "sm:col-span-2")}
                  {field("Preferred Date", schedule?.preferredDate)}
                  {field("Service Time", schedule?.serviceTime)}
                  {field("Estimated Duration", schedule?.estimatedDuration)}
                  {field("Flexible Schedule", schedule?.flexibleSchedule)}
                  {field("Submitted", formatDateTime(request.submittedAt ?? request.createdAt))}
                </div>
              </Card>
            </div>

            {(locationParts.length > 0 || present(location?.siteAccessInstructions)) && (
              <Card className="p-6">
                <h2 className="mb-4 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
                  <MapPin className="h-5 w-5 text-teal-700" />
                  Request Location
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field("Service Address", locationParts.join(", "))}
                  {field("Site Contact", location?.contactName)}
                  {field("Contact Number", location?.contactNumber)}
                  {field(
                    "Site Access Instructions",
                    location?.siteAccessInstructions,
                    "sm:col-span-2",
                  )}
                </div>
              </Card>
            )}

            {attachments.length > 0 && (
              <Card className="p-6">
                <h2 className="mb-4 flex items-center gap-2 border-b pb-3 text-lg font-semibold text-slate-900">
                  <Paperclip className="h-5 w-5 text-teal-700" />
                  Attachments
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {attachments.map((attachment, index) => (
                    <AttachmentItem
                      key={`${index}-${typeof attachment === "string" ? attachment : (attachment.name ?? "file")}`}
                      attachment={attachment}
                      index={index}
                    />
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        <Card className="border-teal-100 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Visiting Schedule Request Status</h2>
              <p className="mt-1 text-sm text-slate-600">
                {rfqQuery.isLoading
                  ? "Checking saved job status…"
                  : rfqQuery.isError
                    ? "Job status unavailable"
                    : !rfq?._id
                      ? "No linked job quotation"
                      : responseStatus === "submitted"
                        ? "Response received"
                        : hasSentRequest
                          ? "Request sent · awaiting requester response"
                          : "Not sent"}
              </p>
              {requestSentAtText && (
                <p className="mt-1 text-xs text-slate-500">Sent {requestSentAtText}</p>
              )}
              {responseStatus === "submitted" && responseSubmittedAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Response received {responseSubmittedAt}
                </p>
              )}
              {rfqQuery.isError && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p role="alert" className="text-sm text-red-700">
                    {readErrorMessage(rfqQuery.error, "Job status")}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => void rfqQuery.refetch()}>
                    <RefreshCw className="h-4 w-4" />
                    Retry job status
                  </Button>
                </div>
              )}
            </div>
            <Button
              disabled={
                sendMutation.isPending ||
                hasSentRequest ||
                !rfq?._id ||
                rfqQuery.isLoading ||
                rfqQuery.isError
              }
              onClick={() => sendMutation.mutate()}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarDays className="h-4 w-4" />
              )}
              {sendMutation.isPending
                ? "Sending…"
                : hasSentRequest
                  ? "Schedule Request Sent"
                  : "Send Schedule Request"}
            </Button>
          </div>
        </Card>
        {responseStatus === "submitted" && (
          <Card className="p-6">
            <h2 className="mb-4 border-b pb-3 text-lg font-semibold text-slate-900">
              Requester Visiting Schedule Response
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("Visiting Date", requesterSchedule?.visitingDate)}
              {field("Visiting Time", requesterSchedule?.visitingTime)}
              {field("Description", requesterSchedule?.description, "sm:col-span-2")}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
