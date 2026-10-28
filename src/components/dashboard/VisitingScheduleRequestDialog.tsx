import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { ApiError, sendProjectRequestVisitingScheduleRequest } from "@/lib/api";

type ProjectRequestDetails = Record<string, unknown>;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function detailValue(value: unknown): string {
  return text(value) ?? "Not available";
}

export function VisitingScheduleRequestDialog({
  open,
  onOpenChange,
  projectRequestId,
  request,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectRequestId?: string;
  request: ProjectRequestDetails;
}) {
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  const sendLock = useRef(false);
  const requester = asRecord(request.requesterId);
  const company = asRecord(request.company);
  const location = asRecord(request.location);
  const linkedProjectRequest = request.projectRequestId;
  const linkedProjectRequestRecord = asRecord(linkedProjectRequest);
  const resolvedProjectRequestId =
    projectRequestId ??
    (typeof linkedProjectRequest === "string" ? linkedProjectRequest : undefined) ??
    text(linkedProjectRequestRecord?._id);
  const requestNumber = request.requestNumber;
  const title = request.projectTitle ?? request.title;
  const requesterName = request.requesterName ?? location?.contactName ?? requester?.name;
  const companyName = request.companyName ?? company?.companyName ?? requester?.companyName;
  const email = request.requesterEmail ?? request.companyEmail ?? company?.email ?? requester?.email;
  const phone = request.requesterPhone ?? location?.contactNumber ?? company?.phone ?? requester?.phone;

  const handleSend = async () => {
    if (!resolvedProjectRequestId || sendLock.current) return;
    sendLock.current = true;
    setIsSending(true);
    setError(undefined);
    try {
      const result = await sendProjectRequestVisitingScheduleRequest(resolvedProjectRequestId);
      if (result?.success !== true) {
        throw new Error(result?.message || "The server did not confirm the schedule request.");
      }
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project-request", resolvedProjectRequestId] }),
        queryClient.invalidateQueries({ queryKey: ["project-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["recent-project-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["booking-details"] }),
      ]).catch(() => undefined);
      toast.success(result.message || "Visiting schedule request sent.");
      onOpenChange(false);
    } catch (sendError) {
      const message =
        sendError instanceof ApiError
          ? sendError.status === 409
            ? "A visiting schedule request may already have been sent. Refresh the request status before trying again."
            : sendError.status === 401
              ? "Your admin session has expired. Sign in again and retry."
              : sendError.status === 403
                ? "Your account is not authorized to send this request."
                : sendError.message
          : sendError instanceof Error
            ? sendError.message
            : "Unable to send the schedule request. Please retry.";
      setError(message);
    } finally {
      sendLock.current = false;
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <span className="font-semibold text-slate-700">Email:</span> {text(email)}
            </p>
          )}
          {text(phone) && (
            <p>
              <span className="font-semibold text-slate-700">Phone:</span> {text(phone)}
            </p>
          )}
        </div>

        {!resolvedProjectRequestId ? (
          <p role="status" className="text-sm text-amber-700">
            The Project Request ID is unavailable for this record, so a schedule request cannot be sent.
          </p>
        ) : error ? (
          <p role="alert" className="text-sm text-red-700">{error}</p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" disabled={isSending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!resolvedProjectRequestId || isSending} onClick={handleSend}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            {isSending ? "Sending…" : "Send Schedule Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
