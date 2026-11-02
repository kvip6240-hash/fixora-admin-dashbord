type RequestState = {
  visitingScheduleRequestStatus?: unknown;
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
