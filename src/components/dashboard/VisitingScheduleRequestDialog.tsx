import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/app-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ApiError,
  fetchAdminRfqDetails,
  sendVisitingScheduleRequest,
  type AdminRfqDetails,
} from "@/lib/api";

type ProjectRequestDetails = Record<string, unknown>;
type Feedback = { kind: "error" | "info"; message: string } | null;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function alreadyRequested(rfq: AdminRfqDetails): boolean {
  return Boolean(
    rfq.visitingScheduleRequestedAt ||
    String(rfq.visitingScheduleRequestStatus ?? "").toLowerCase() === "sent" ||
    String(rfq.visitingScheduleResponseStatus ?? "").toLowerCase() === "submitted",
  );
}

function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return error.message;
    if (error.status === 401) return "Your admin session has expired. Sign in again and retry.";
    if (error.status === 403) return "Your account is not authorized to send this request.";
    if (error.status >= 500)
      return `The server could not send the request (${error.status}). Please try again.`;
    return error.message;
  }
  return error instanceof Error ? error.message : "Unable to send the schedule request.";
}

function detailValue(value: unknown): string {
  return text(value) ?? "Not available";
}

function sentAtLabel(value: unknown): string | undefined {
  const timestamp = text(value);
  if (!timestamp) return undefined;
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? undefined : date.toLocaleString();
}

export function VisitingScheduleRequestDialog({
  open,
  onOpenChange,
  requestId,
  request,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  request: ProjectRequestDetails;
}) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [requestAlreadySent, setRequestAlreadySent] = useState(false);
  const [savedRequestTimestamp, setSavedRequestTimestamp] = useState<string>();

  const sendMutation = useMutation({
    retry: false,
    mutationFn: async () => {
      const rfqResponse = await fetchAdminRfqDetails(requestId);
      const rfqId = text(rfqResponse.data?._id);
      if (!rfqResponse.success || !rfqId) {
        throw new Error(
          "The RFQ lookup did not return a verified RFQ ID. No schedule request was sent.",
        );
      }

      const rfq = rfqResponse.data;
      if (alreadyRequested(rfq)) {
        return { kind: "already-sent" as const, rfq };
      }

      const response = await sendVisitingScheduleRequest(rfqId);
      if (!response.success) {
        throw new Error(response.message || "The backend did not confirm the schedule request.");
      }
      return { kind: "sent" as const, rfq, response };
    },
    onSuccess: async (result) => {
      if (result.kind === "already-sent") {
        setRequestAlreadySent(true);
        setSavedRequestTimestamp(sentAtLabel(result.rfq.visitingScheduleRequestedAt));
        setFeedback({
          kind: "info",
          message: "A schedule request has already been sent for this RFQ. No duplicate was sent.",
        });
        queryClient.setQueryData(["admin-rfq-details", requestId], {
          success: true,
          data: result.rfq,
        });
        return;
      }

      const sentData = asRecord(result.response.data) as Partial<AdminRfqDetails> | undefined;
      queryClient.setQueryData(["admin-rfq-details", requestId], {
        success: true,
        data: { ...result.rfq, ...sentData },
      });
      void fetchAdminRfqDetails(requestId)
        .then((refreshedRfq) => {
          queryClient.setQueryData(["admin-rfq-details", requestId], refreshedRfq);
        })
        .catch(() => {
          // The POST response confirms success; keep its saved status cached if refresh fails.
        });
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project-request", requestId] }),
        queryClient.invalidateQueries({ queryKey: ["booking-details", requestId] }),
        queryClient.invalidateQueries({ queryKey: ["project-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-project-requests"] }),
      ]).catch(() => undefined);
      toast.success(result.response.message || "Visiting schedule request sent.");
      setFeedback(null);
      setRequestAlreadySent(false);
      setSavedRequestTimestamp(undefined);
      // useMutation is still pending while onSuccess runs, so bypass the user-close guard.
      onOpenChange(false);
    },
    onError: async (error: unknown) => {
      if (error instanceof ApiError && error.status === 404) {
        setFeedback({
          kind: "error",
          message:
            "No quotation/RFQ is linked to this request yet. Please prepare the quotation before sending a visiting schedule request.",
        });
        return;
      }

      if (error instanceof ApiError && error.status === 409) {
        try {
          const refreshed = await fetchAdminRfqDetails(requestId);
          const rfq = refreshed.data;
          if (refreshed.success && rfq?._id && alreadyRequested(rfq)) {
            setRequestAlreadySent(true);
            setSavedRequestTimestamp(sentAtLabel(rfq.visitingScheduleRequestedAt));
            setFeedback({
              kind: "info",
              message:
                "This schedule request was already sent. The saved status has been refreshed; no duplicate was sent.",
            });
            queryClient.setQueryData(["admin-rfq-details", requestId], refreshed);
            return;
          }
        } catch {
          // Keep the original conflict visible if saved status cannot be refreshed.
        }
        setFeedback({
          kind: "error",
          message:
            "The server rejected this as a duplicate, but the saved status could not be confirmed. Please retry.",
        });
        return;
      }

      setFeedback({ kind: "error", message: apiErrorMessage(error) });
    },
  });

  const requester = asRecord(request.requesterId);
  const company = asRecord(request.company);
  const location = asRecord(request.location);
  const requestNumber = request.requestNumber;
  const title = request.projectTitle ?? request.title;
  const requesterName = request.requesterName ?? location?.contactName ?? requester?.name;
  const companyName = request.companyName ?? company?.companyName ?? requester?.companyName;
  const email =
    request.requesterEmail ?? request.companyEmail ?? company?.email ?? requester?.email;
  const phone =
    request.requesterPhone ?? location?.contactNumber ?? company?.phone ?? requester?.phone;

  const handleOpenChange = (nextOpen: boolean) => {
    if (sendMutation.isPending) return;
    if (!nextOpen) {
      setFeedback(null);
      setRequestAlreadySent(false);
      setSavedRequestTimestamp(undefined);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Visiting Schedule Request</DialogTitle>
          <DialogDescription>
            Do you want to send a visiting schedule request to this client?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-700">Request number:</span>{" "}
            {detailValue(requestNumber)}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Project title:</span>{" "}
            {detailValue(title)}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Requester:</span>{" "}
            {detailValue(requesterName)}
          </p>
          {text(companyName) && (
            <p>
              <span className="font-semibold text-slate-700">Company:</span> {text(companyName)}
            </p>
          )}
          {text(email) && (
            <p>
              <span className="font-semibold text-slate-700">Contact:</span> {text(email)}
            </p>
          )}
          {!text(email) && text(phone) && (
            <p>
              <span className="font-semibold text-slate-700">Phone:</span> {text(phone)}
            </p>
          )}
        </div>

        {feedback && (
          <p
            role="status"
            className={
              feedback.kind === "error" ? "text-sm text-red-700" : "text-sm text-amber-700"
            }
          >
            {feedback.message}
            {savedRequestTimestamp && (
              <span className="mt-1 block">Sent {savedRequestTimestamp}</span>
            )}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            disabled={sendMutation.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={sendMutation.isPending || requestAlreadySent}
            onClick={() => {
              setFeedback(null);
              sendMutation.mutate();
            }}
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarDays className="h-4 w-4" />
            )}
            {sendMutation.isPending
              ? "Checking and sending…"
              : requestAlreadySent
                ? "Schedule Request Sent"
                : "Send Schedule Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
