/**
 * src/components/dashboard/RequestDetailModal.tsx
 *
 * Full-detail modal for a project request opened from the Dashboard Recent Bookings.
 * - Sections: Requester, Company, Project, Location, Schedule, Attachments, Status
 * - Bottom: "Prepare Quotation" primary button → opens PrepareRFQModal
 * - API: POST /api/admin/project-requests/:id/prepare-quotation
 */

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  X,
  User as UserIcon,
  Building2,
  FileText,
  MapPin,
  CalendarDays,
  Paperclip,
  Download,
  Send,
  Loader2,
  FileCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/app-shell";
import {
  fetchProjectRequestById,
  prepareProjectQuotation,
  updateBookingDetails,
  type ProjectRequest,
  type PrepareQuotationPayload,
} from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// ─── Data Extractors ──────────────────────────────────────────────────────────

function unwrap(raw: any): any {
  return raw?.data ?? raw?.project ?? raw;
}

function getCategoryName(raw: any): string {
  const req = unwrap(raw);
  for (const key of ["categoryId", "categoryName", "category", "serviceCategory", "service"]) {
    const val = req[key];
    if (!val) continue;
    if (typeof val === "string") return val;
    if (typeof val === "object" && !Array.isArray(val)) {
      if (val.name) return String(val.name);
      if (val.title) return String(val.title);
    }
  }
  return "—";
}

function getCompanyDetails(raw: any): { name: string; email: string } {
  const req = unwrap(raw);
  let name = "—";
  let email = "—";
  if (req.companyName) name = req.companyName;
  if (req.companyEmail) email = req.companyEmail;
  const co = req.company || req.companyId;
  if (co && typeof co === "object") {
    if (co.name && name === "—") name = co.name;
    if (co.companyName && name === "—") name = co.companyName;
    if (co.email && email === "—") email = co.email;
    if (co.companyEmail && email === "—") email = co.companyEmail;
  } else if (typeof co === "string" && name === "—") {
    name = co;
  }
  if (name === "—" || email === "—") {
    const user = req.requesterId || req.requester || req.user;
    if (user && typeof user === "object") {
      if (user.companyName && name === "—") name = user.companyName;
      if (user.email && email === "—") email = user.email;
    }
  }
  return { name, email };
}

function getRequesterDetails(raw: any): { name: string; email: string; phone: string } {
  const req = unwrap(raw);
  const user = req.requesterId || req.requester || req.user || req.userId || {};
  const isObj = typeof user === "object";
  const name = isObj ? (user.name || user.fullName || req.requesterName || "—") : String(user || "—");
  const email = isObj ? (user.email || req.requesterEmail || req.email || "—") : "—";
  const phone = isObj ? (user.phone || user.mobile || req.requesterPhone || req.phone || "—") : (req.phone || "—");
  return { name, email, phone };
}

function getLocationDetails(raw: any): { siteName: string; address: string; city: string; state: string; country: string; pincode: string } {
  const req = unwrap(raw);
  const loc = req.location || req.siteLocation || req.addressDetails || {};
  if (typeof loc === "string") return { siteName: "—", address: loc, city: "—", state: "—", country: "—", pincode: "—" };
  return {
    siteName: loc.siteName || loc.name || req.siteName || "—",
    address: loc.address || loc.street || loc.line1 || req.address || "—",
    city: loc.city || req.city || "—",
    state: loc.state || req.state || "—",
    country: loc.country || req.country || "—",
    pincode: loc.pincode || loc.postalCode || loc.zip || req.pincode || req.zip || "—",
  };
}

function getScheduleDetails(raw: any): { preferredDate: string; serviceTime: string; estimatedDuration: string } {
  const req = unwrap(raw);
  const sched = req.schedule || req.timing || {};
  if (typeof sched === "string") return { preferredDate: sched, serviceTime: "—", estimatedDuration: "—" };
  return {
    preferredDate: sched.preferredDate || sched.date || req.preferredDate || "—",
    serviceTime: sched.serviceTime || sched.time || req.serviceTime || "—",
    estimatedDuration: sched.estimatedDuration || sched.duration || req.estimatedDuration || "—",
  };
}

function formatDateTime(raw?: string): { date: string; time: string } {
  if (!raw) return { date: "—", time: "—" };
  try {
    const d = new Date(raw);
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });
    return { date, time };
  } catch {
    return { date: "—", time: "—" };
  }
}

// ─── Status Colours ───────────────────────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-700 border-blue-200",
  rfq:       "bg-purple-500/15 text-purple-700 border-purple-200",
  published: "bg-amber-500/15 text-amber-700 border-amber-200",
  assigned:  "bg-indigo-500/15 text-indigo-700 border-indigo-200",
  completed: "bg-emerald-500/15 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-500/15 text-slate-600 border-slate-200",
  rejected:  "bg-red-500/15 text-red-700 border-red-200",
};

function StatusBadge({ status }: { status?: string }) {
  const key = (status ?? "").toLowerCase();
  const cls = STATUS_CLASSES[key] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {status || "—"}
    </span>
  );
}

const PRIORITY_CLASSES: Record<string, string> = {
  high:      "bg-red-500/15 text-red-700 border-red-200",
  emergency: "bg-rose-950 text-rose-100 border-rose-900",
  medium:    "bg-orange-500/15 text-orange-700 border-orange-200",
  low:       "bg-emerald-500/15 text-emerald-700 border-emerald-200",
};

function PriorityBadge({ priority }: { priority?: string }) {
  const key = (priority ?? "").toLowerCase();
  const cls = PRIORITY_CLASSES[key] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {priority || "—"}
    </span>
  );
}

// ─── Prepare RFQ Modal ────────────────────────────────────────────────────────

function PrepareRFQModal({
  projectId,
  onClose,
  onSuccess,
}: {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<PrepareQuotationPayload>({
    amount: 0,
    currency: "GBP",
    estimatedDuration: "1 Day",
    hourlyRate: 0,
    labourCost: 0,
    materialCost: 0,
    serviceCharge: 0,
    tax: 0,
    discount: 0,
    remarks: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (payload: PrepareQuotationPayload) => prepareProjectQuotation(projectId, payload),
    onSuccess: () => {
      toast.success("RFQ has been sent successfully.");
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit RFQ. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formData.amount || formData.amount <= 0) errs.amount = "Amount must be greater than 0";
    if (!formData.currency) errs.currency = "Currency is required";
    if (!formData.estimatedDuration) errs.estimatedDuration = "Duration is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    mutation.mutate(formData);
  };

  const field = (label: string, key: keyof PrepareQuotationPayload, required = false, span2 = false) => (
    <div className={span2 ? "md:col-span-2" : ""}>
      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="number" min="0" step="0.01" placeholder="0.00"
        value={(formData[key] as number) || ""}
        onChange={(e) => setFormData({ ...formData, [key]: parseFloat(e.target.value) || 0 })}
        className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary outline-none text-sm"
      />
      {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Prepare RFQ</h2>
              <p className="text-xs text-muted-foreground">Specify commercial terms and submit quotation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number" min="0" step="0.01" placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary outline-none text-sm font-medium"
              />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
            </div>

            {/* Currency */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary outline-none text-sm font-medium"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
              {errors.currency && <p className="text-xs text-red-500 mt-1">{errors.currency}</p>}
            </div>

            {/* Estimated Duration */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Estimated Duration <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary outline-none text-sm font-medium"
              >
                <option value="1 Day">1 Day</option>
                <option value="2 Days">2 Days</option>
                <option value="3 Days">3 Days</option>
                <option value="1 Week">1 Week</option>
                <option value="2 Weeks">2 Weeks</option>
              </select>
              {errors.estimatedDuration && <p className="text-xs text-red-500 mt-1">{errors.estimatedDuration}</p>}
            </div>

            {field("Hourly Rate", "hourlyRate")}
            {field("Labour Cost", "labourCost")}
            {field("Material Cost", "materialCost")}
            {field("Service Charge", "serviceCharge")}
            {field("Tax", "tax")}
            {field("Discount", "discount", false, true)}

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Remarks</label>
              <textarea
                rows={3}
                placeholder="Add notes, scope details, or conditions for the client..."
                value={formData.remarks || ""}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full p-3 rounded-lg bg-secondary/50 border border-border focus:border-primary outline-none text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-teal-700 hover:bg-teal-800 text-white min-w-[130px] flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting...</span></>
              ) : (
                <><Send className="w-4 h-4" /><span>Submit RFQ</span></>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Section wrapper helper ───────────────────────────────────────────────────

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground block">{label}</span>
      <span className="font-medium text-foreground text-sm">{value || "—"}</span>
    </div>
  );
}

// ─── Request Detail Modal ─────────────────────────────────────────────────────

export function RequestDetailModal({
  projectId,
  fallbackProject,
  onClose,
  onQuotationSuccess,
}: {
  projectId: string;
  fallbackProject?: ProjectRequest;
  onClose: () => void;
  onQuotationSuccess?: () => void;
}) {
  const [isPrepareOpen, setIsPrepareOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: fetched, isLoading } = useQuery({
    queryKey: ["project-request", projectId],
    queryFn: () => fetchProjectRequestById(projectId),
    initialData: () => queryClient.getQueryData<ProjectRequest>(["project-request", projectId]),
    staleTime: 0,
    enabled: !!projectId,
  });

  const raw: any = fetched || fallbackProject;
  const project: any = unwrap(raw);

  // Single source of truth status normalizer
  const normalizedStatus = project?.status || project?.workflowStatus || project?.requestStatus || project?.quotationStatus || project?.jobStatus || "Submitted";

  const requester = getRequesterDetails(project);
  const company = getCompanyDetails(project);
  const category = getCategoryName(project);
  const location = getLocationDetails(project);
  const schedule = getScheduleDetails(project);

  const title = project?.title || project?.projectName || project?.name || "Project Request";
  const reqNumber = project?.requestNumber || project?.reqNumber || project?.code || project?._id?.slice(-6)?.toUpperCase() || "—";
  const rawDate = project?.createdAt || project?.submittedAt || project?.created_at || project?.updatedAt;
  const { date: submittedDate, time: submittedTime } = formatDateTime(rawDate);

  const handlePrepareSuccess = () => {
    setIsPrepareOpen(false);
    queryClient.invalidateQueries({ queryKey: ["project-request", projectId] });
    queryClient.invalidateQueries({ queryKey: ["project-requests"] });
    queryClient.invalidateQueries({ queryKey: ["recent-project-requests"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    onQuotationSuccess?.();
    onClose();
  };

  const publishMutation = useMutation({
    mutationFn: () => updateBookingDetails(projectId, { status: "Published" }),
    onSuccess: () => {
      toast.success("Job has been published successfully.");
      queryClient.invalidateQueries({ queryKey: ["project-requests"] });
      queryClient.invalidateQueries({ queryKey: ["project-request", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-project-requests"] });
      onQuotationSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish job.");
    },
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl p-6 my-8 max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between mb-5 border-b border-border pb-4">
            <div className="space-y-1.5">
              <div className="flex items-center flex-wrap gap-2">
                {reqNumber && (
                  <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                    {reqNumber}
                  </span>
                )}
                <StatusBadge status={String(project?.status ?? "")} />
                <PriorityBadge priority={String(project?.priority ?? "")} />
              </div>
              <h2 className="text-xl font-bold text-foreground leading-tight">{String(title)}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-secondary/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              {/* Requester & Company (side by side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section icon={UserIcon} title="Requester Details">
                  <div className="space-y-2">
                    <InfoRow label="Name" value={requester.name} />
                    <InfoRow label="Email" value={requester.email} />
                    <InfoRow label="Phone" value={requester.phone} />
                  </div>
                </Section>
                <Section icon={Building2} title="Company Details">
                  <div className="space-y-2">
                    <InfoRow label="Company Name" value={company.name} />
                    <InfoRow label="Company Email" value={company.email} />
                  </div>
                </Section>
              </div>

              {/* Project Details */}
              <Section icon={FileText} title="Project Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Request Number" value={reqNumber} />
                  <InfoRow label="Category / Service" value={category} />
                  <div className="sm:col-span-2">
                    <InfoRow label="Project Title" value={String(title)} />
                  </div>
                  {project?.description && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-muted-foreground block mb-1">Description</span>
                      <div className="p-3 rounded-lg bg-card border border-border/60 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        {String(project.description)}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Priority</span>
                    <PriorityBadge priority={String(project?.priority ?? "")} />
                  </div>
                </div>
              </Section>

              {/* Location & Schedule (side by side) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Section icon={MapPin} title="Location">
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRow label="Site Name" value={location.siteName} />
                    <InfoRow label="City" value={location.city} />
                    <InfoRow label="State" value={location.state} />
                    <InfoRow label="Country" value={location.country} />
                    <InfoRow label="Pincode" value={location.pincode} />
                    <div className="col-span-2">
                      <InfoRow label="Address" value={location.address} />
                    </div>
                  </div>
                </Section>
                <Section icon={CalendarDays} title="Schedule">
                  <div className="space-y-2">
                    <InfoRow label="Preferred Date" value={schedule.preferredDate} />
                    <InfoRow label="Service Time" value={schedule.serviceTime} />
                    <InfoRow label="Estimated Duration" value={schedule.estimatedDuration} />
                  </div>
                </Section>
              </div>

              {/* Attachments */}
              {Array.isArray(project?.attachments) && project.attachments.length > 0 && (
                <Section icon={Paperclip} title="Attachments">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(project.attachments as string[]).map((url, i) => {
                      const isPdf = typeof url === "string" && url.toLowerCase().includes(".pdf");
                      return (
                        <div key={i} className="p-3 rounded-lg bg-card border border-border flex flex-col items-center gap-2 group">
                          {isPdf ? (
                            <div className="flex flex-col items-center gap-1 py-2">
                              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-red-100">
                                PDF
                              </div>
                              <span className="text-xs font-medium text-foreground truncate max-w-[110px]">Document #{i + 1}</span>
                            </div>
                          ) : (
                            <div className="w-full h-24 rounded overflow-hidden bg-muted">
                              <img
                                src={url}
                                alt={`Attachment ${i + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                              />
                            </div>
                          )}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-1 px-2 rounded bg-secondary hover:bg-secondary/70 text-xs font-medium text-primary flex items-center justify-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Status & Submitted Info */}
              <Section icon={CheckCircle2} title="Status">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Status</span>
                    <StatusBadge status={String(normalizedStatus)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Submitted Date</span>
                      <span className="font-medium text-foreground text-sm">{submittedDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Submitted Time</span>
                      <span className="font-medium text-foreground text-sm">{submittedTime}</span>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ── Bottom Action Bar ── */}
          <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            
            {(normalizedStatus === "Submitted" || normalizedStatus === "RFQ") && (
              <Button
                disabled={isLoading}
                className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-semibold px-8 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-base transition-all"
                onClick={() => setIsPrepareOpen(true)}
              >
                <Send className="w-5 h-5" />
                <span>Prepare Quotation</span>
              </Button>
            )}

            {normalizedStatus === "Accepted" && (
              <Button
                disabled={isLoading || publishMutation.isPending}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-base transition-all"
                onClick={() => publishMutation.mutate()}
              >
                {publishMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Publish Job</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Nested Prepare RFQ Modal ── */}
      {isPrepareOpen && (
        <PrepareRFQModal
          projectId={projectId}
          onClose={() => setIsPrepareOpen(false)}
          onSuccess={handlePrepareSuccess}
        />
      )}
    </>
  );
}
