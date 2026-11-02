import { CalendarCheck2, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/app-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fallbackRequestNumber?: string;
  request: unknown;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
};

type DataRecord = Record<string, unknown>;

function asRecord(value: unknown): DataRecord | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as DataRecord)
    : undefined;
}

function displayText(value: unknown, fallback = "Not provided"): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function formatDate(value: unknown, includeTime = false): string {
  if (typeof value !== "string" && !(value instanceof Date)) return "Not provided";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat("en-GB", includeTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" },
  ).format(date);
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

export function SubmittedVisitingScheduleDialog({
  open,
  onOpenChange,
  fallbackRequestNumber,
  request: requestData,
  isLoading = false,
  error,
  onRetry,
}: Props) {
  const response = asRecord(requestData);
  const request = asRecord(response?.data) ?? asRecord(response?.project) ?? response;
  const schedule = asRecord(request?.requesterVisitingSchedule);
  const hasSchedule = Boolean(schedule);
  const requestedAt = typeof request?.visitingScheduleRequestedAt === "string"
    ? new Date(request.visitingScheduleRequestedAt).getTime()
    : Number.NaN;
  const scheduleSubmittedAt = typeof schedule?.submittedAt === "string"
    ? new Date(schedule.submittedAt).getTime()
    : Number.NaN;
  const isPreviousSchedule = Number.isFinite(requestedAt)
    && Number.isFinite(scheduleSubmittedAt)
    && scheduleSubmittedAt < requestedAt;
  const location = asRecord(request?.location);
  const company = asRecord(request?.company);
  const requester = asRecord(request?.requesterId);
  const requestNumber = displayText(request?.requestNumber ?? fallbackRequestNumber, "Not available");
  const customerName = displayText(
    request?.requesterName
      ?? location?.contactName
      ?? request?.contactPersonName
      ?? requester?.fullName
      ?? requester?.contactPersonName
      ?? company?.fullName
      ?? company?.contactPersonName
      ?? request?.companyName
      ?? company?.companyName
      ?? requester?.companyName,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck2 className="h-5 w-5 text-primary" />
            Customer Submitted Visiting Schedule
          </DialogTitle>
          <DialogDescription>
            Saved visiting schedule information submitted by the customer.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin" /> Loading submitted schedule…
          </div>
        ) : error ? (
          <div className="space-y-3 py-5 text-center" role="alert">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Unable to load the submitted visiting schedule."}
            </p>
            <Button variant="outline" size="sm" onClick={onRetry} disabled={!onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        ) : !request ? (
          <div className="py-8 text-center text-sm text-muted-foreground" role="status">
            Project Request details are unavailable.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Project Request Number" value={requestNumber} />
              <Detail label="Customer Name" value={customerName} />
            </div>

            {hasSchedule ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <CalendarCheck2 className="h-4 w-4" /> Received
                </div>
                {isPreviousSchedule && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    This is the previous submitted schedule. The latest request is awaiting a customer response.
                  </p>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail label="Visiting Date" value={formatDate(schedule?.visitingDate)} />
                  <Detail label="Visiting Time" value={displayText(schedule?.visitingTime)} />
                  <Detail label="Description" value={displayText(schedule?.description)} />
                  <Detail label="Submitted Date & Time" value={formatDate(schedule?.submittedAt, true)} />
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-border bg-secondary/30 px-4 py-5 text-center text-sm text-muted-foreground" role="status">
                Customer has not submitted a visiting schedule yet.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
