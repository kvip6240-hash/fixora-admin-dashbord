type RequestState = {
  visitingScheduleRequestStatus?: unknown;
  visitingScheduleRequestedAt?: unknown;
  requesterVisitingSchedule?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function hasSubmittedVisitingSchedule(request: RequestState | null | undefined): boolean {
  return Boolean(asRecord(request?.requesterVisitingSchedule));
}

/** Only backend states that the send endpoint explicitly accepts may show the action. */
export function canSendVisitingScheduleRequest(request: RequestState | null | undefined): boolean {
  return request?.visitingScheduleRequestStatus === "NotSent"
    || request?.visitingScheduleRequestStatus === "NotificationFailed";
}

export function hasCurrentScheduleResponse(request: RequestState | null | undefined): boolean {
  const schedule = asRecord(request?.requesterVisitingSchedule);
  if (!schedule || request?.visitingScheduleRequestStatus === "NotSent" || request?.visitingScheduleRequestStatus === "NotificationFailed") {
    return false;
  }

  const requestedAt = request?.visitingScheduleRequestedAt;
  const submittedAt = schedule.submittedAt;
  if (typeof requestedAt === "string" && typeof submittedAt === "string") {
    const requestedTime = new Date(requestedAt).getTime();
    const submittedTime = new Date(submittedAt).getTime();
    if (Number.isFinite(requestedTime) && Number.isFinite(submittedTime)) {
      return submittedTime >= requestedTime;
    }
  }

  // Persisted schedule data is authoritative when one or both timestamps are
  // unavailable; response status can be stale or missing.
  return true;
}

export function isScheduleRequestWaiting(request: RequestState | null | undefined): boolean {
  const status = request?.visitingScheduleRequestStatus;
  return (status === "Sending" || status === "Sent") && !hasCurrentScheduleResponse(request);
}
