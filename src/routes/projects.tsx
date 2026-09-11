import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell, Card, Button } from "@/components/app-shell";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Building2,
  CalendarDays,
  Tag,
  Paperclip,
  Clock,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  User as UserIcon,
  MapPin,
  FileText,
  Download,
  FileCheck,
  Send,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useProjectsController } from "../hooks/useProjectsController";
import { prepareProjectQuotation, publishProjectJob, updateBookingDetails, fetchProjectRequestById, getAttachmentUrl, type ProjectRequest, type PrepareQuotationPayload } from "@/lib/api";
import { AttachmentItem } from "@/components/dashboard/AttachmentItem";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Project Requests — Fixora Admin" },
      {
        name: "description",
        content: "Track and manage all project requests submitted on Fixora.",
      },
      { property: "og:title", content: "Project Requests — Fixora Admin" },
      {
        property: "og:description",
        content: "Track and manage all project requests submitted on Fixora.",
      },
    ],
  }),
  component: ProjectRequestsPage,
});

// Helper formatters
function formatSubmissionDate(rawDate?: unknown): { date: string; time: string } {
  if (!rawDate) return { date: "—", time: "" };
  const str = String(rawDate).trim();
  if (!str || str === "undefined" || str === "null" || str === "NaN") return { date: "—", time: "" };
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return { date: "—", time: "" };

    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return { date, time };
  } catch {
    return { date: "—", time: "" };
  }
}

function getCategoryName(reqInput: any): string {
  if (!reqInput) return "—";
  const req = reqInput.data ?? reqInput.project ?? reqInput;

  // ✅ Nested inside projectDetails (Fixora API structure)
  if (req.projectDetails && typeof req.projectDetails === "object") {
    const pd = req.projectDetails;
    if (typeof pd.categoryName === "string" && pd.categoryName) return pd.categoryName;
    if (pd.categoryId && typeof pd.categoryId === "object" && pd.categoryId.name) return String(pd.categoryId.name);
    if (pd.category && typeof pd.category === "string") return pd.category;
    if (pd.category && typeof pd.category === "object" && pd.category.name) return String(pd.category.name);
  }

  // Direct string fields
  for (const key of [
    "category", "categoryName", "serviceCategory", "service", "serviceName",
    "jobCategory", "serviceType", "type", "projectType", "trade",
    "subCategory", "specialization", "domain", "industry",
  ]) {
    if (typeof req[key] === "string" && req[key]) return req[key];
  }

  // Object fields with nested name/title/label
  for (const key of [
    "category", "categoryId", "serviceCategory", "service",
    "jobCategory", "categoryObj", "serviceObj",
  ]) {
    const val = req[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if (val.name) return String(val.name);
      if (val.title) return String(val.title);
      if (val.label) return String(val.label);
    }
  }

  return "—";
}

function getCompanyDetails(reqInput: any): { name: string; email: string } {
  if (!reqInput) return { name: "—", email: "—" };
  const req = reqInput.data ?? reqInput.project ?? reqInput;

  let name = "—";
  let email = "—";

  const checkObj = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    if (obj.name && obj.name !== "—") name = String(obj.name);
    else if (obj.companyName) name = String(obj.companyName);
    else if (obj.title) name = String(obj.title);

    if (obj.email && obj.email !== "—") email = String(obj.email);
    else if (obj.companyEmail) email = String(obj.companyEmail);
  };

  if (typeof req.companyName === "string" && req.companyName) name = req.companyName;
  if (typeof req.companyEmail === "string" && req.companyEmail) email = req.companyEmail;

  if (name === "—" && req.company) {
    if (typeof req.company === "string") name = req.company;
    else checkObj(req.company);
  }

  if (name === "—" && req.companyId) {
    if (typeof req.companyId === "string") name = req.companyId;
    else checkObj(req.companyId);
  }

  if (name === "—") {
    checkObj(req.requesterId || req.requester || req.user || req.userId || req.client || req.customer || req.customerId);
  }

  if (email === "—") {
    if (typeof req.email === "string" && req.email) email = req.email;
    else if (typeof req.contactEmail === "string" && req.contactEmail) email = req.contactEmail;
    else if (req.requesterEmail) email = String(req.requesterEmail);
  }

  return { name, email };
}

function getRequesterDetails(reqInput: any): { name: string; email: string; phone: string } {
  if (!reqInput) return { name: "—", email: "—", phone: "—" };
  const req = reqInput.data ?? reqInput.project ?? reqInput;
  const user = req.requesterId || req.requester || req.user || req.userId || req.client || req.customer || {};

  const name = typeof user === "object" ? (user.name || user.fullName || req.requesterName || "—") : String(user || "—");
  const email = typeof user === "object" ? (user.email || req.requesterEmail || req.email || "—") : "—";
  const phone = typeof user === "object" ? (user.phone || user.mobile || req.requesterPhone || req.phone || "—") : (req.phone || "—");

  return { name, email, phone };
}

function getLocationDetails(reqInput: any): { siteName: string; address: string; city: string; state: string; country: string; pincode: string } {
  if (!reqInput) return { siteName: "—", address: "—", city: "—", state: "—", country: "—", pincode: "—" };
  const req = reqInput.data ?? reqInput.project ?? reqInput;
  const loc = req.location || req.siteLocation || req.addressDetails || {};

  if (typeof loc === "string") {
    return { siteName: "—", address: loc, city: "—", state: "—", country: "—", pincode: "—" };
  }

  return {
    siteName: loc.siteName || loc.name || req.siteName || "—",
    address: loc.address || loc.street || loc.line1 || req.address || "—",
    city: loc.city || req.city || "—",
    state: loc.state || req.state || "—",
    country: loc.country || req.country || "—",
    pincode: loc.pincode || loc.postalCode || loc.zip || req.pincode || req.zip || "—",
  };
}

function getScheduleDetails(reqInput: any): { preferredDate: string; serviceTime: string; estimatedDuration: string } {
  if (!reqInput) return { preferredDate: "—", serviceTime: "—", estimatedDuration: "—" };
  const req = reqInput.data ?? reqInput.project ?? reqInput;
  const sched = req.schedule || req.timing || {};

  if (typeof sched === "string") {
    return { preferredDate: sched, serviceTime: "—", estimatedDuration: "—" };
  }

  return {
    preferredDate: sched.preferredDate || sched.date || req.preferredDate || "—",
    serviceTime: sched.serviceTime || sched.time || req.serviceTime || "—",
    estimatedDuration: sched.estimatedDuration || sched.duration || req.estimatedDuration || "—",
  };
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority?: string }) {
  const p = (priority ?? "Medium").trim().toLowerCase();

  if (p === "high") {
    return (
      <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40 font-medium hover:bg-red-500/20 shadow-none">
        High
      </Badge>
    );
  }
  if (p === "medium") {
    return (
      <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/40 font-medium hover:bg-orange-500/20 shadow-none">
        Medium
      </Badge>
    );
  }
  if (p === "low") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 font-medium hover:bg-emerald-500/20 shadow-none">
        Low
      </Badge>
    );
  }
  if (p === "emergency") {
    return (
      <Badge className="bg-rose-950 text-rose-100 dark:bg-rose-900 dark:text-rose-100 border-rose-900 font-semibold hover:bg-rose-900 shadow-none">
        Emergency
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="font-medium">
      {priority ?? "Normal"}
    </Badge>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status?: string }) {
  const rawStatus = (status ?? "Submitted").trim();
  const s = rawStatus.toLowerCase();

  let styleClass = "bg-secondary text-secondary-foreground border-border";

  if (s === "submitted") {
    styleClass =
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40";
  } else if (s === "rfq") {
    styleClass =
      "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/40";
  } else if (s === "published") {
    styleClass =
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40";
  } else if (s === "assigned") {
    styleClass =
      "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40";
  } else if (s === "accepted") {
    styleClass =
      "bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800/40";
  } else if (s === "completed") {
    styleClass =
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40";
  } else if (s === "cancelled") {
    styleClass =
      "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800/40";
  } else if (s === "rejected") {
    styleClass =
      "bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40";
  }

  return (
    <Badge className={`${styleClass} font-medium hover:opacity-90 shadow-none border`}>
      {rawStatus}
    </Badge>
  );
}





// Prepare RFQ Modal Component
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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const prepareMutation = useMutation({
    mutationFn: (payload: PrepareQuotationPayload) => prepareProjectQuotation(projectId, payload),
    onSuccess: () => {
      toast.success("RFQ has been sent successfully.");
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit RFQ. Please check your inputs and try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prepareMutation.isPending) return;
    const errors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = "Amount must be greater than 0";
    }
    if (!formData.currency) {
      errors.currency = "Currency is required";
    }
    if (!formData.estimatedDuration) {
      errors.estimatedDuration = "Estimated duration is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    prepareMutation.mutate(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full rounded-2xl bg-card border border-border shadow-2xl flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
        style={{
          width: "calc(100vw - 32px)",
          maxWidth: "820px",
          maxHeight: "90vh",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-foreground leading-snug">Prepare RFQ</h2>
              <p className="text-[13px] text-muted-foreground leading-tight">Specify commercial terms and submit quotation details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={prepareMutation.isPending}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 sm:py-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
              {/* Amount */}
              <div>
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Amount <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full h-[44px] min-h-[44px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium transition-colors box-border"
                />
                {formErrors.amount && <p className="text-xs text-red-500 mt-1">{formErrors.amount}</p>}
              </div>

              {/* Currency Dropdown */}
              <div>
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Currency <span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full h-[44px] min-h-[44px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium transition-colors box-border"
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
                {formErrors.currency && <p className="text-xs text-red-500 mt-1">{formErrors.currency}</p>}
              </div>

              {/* Estimated Duration Dropdown */}
              <div>
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Estimated Duration <span className="text-red-500 ml-0.5">*</span>
                </label>
                <select
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  className="w-full h-[44px] min-h-[44px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium transition-colors box-border"
                >
                  <option value="1 Day">1 Day</option>
                  <option value="2 Days">2 Days</option>
                  <option value="3 Days">3 Days</option>
                  <option value="1 Week">1 Week</option>
                  <option value="2 Weeks">2 Weeks</option>
                </select>
                {formErrors.estimatedDuration && <p className="text-xs text-red-500 mt-1">{formErrors.estimatedDuration}</p>}
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.hourlyRate || ""}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full h-[44px] min-h-[44px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium transition-colors box-border"
                />
              </div>

              {/* Labour Cost */}
              <div>
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Labour Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.labourCost || ""}
                  onChange={(e) => setFormData({ ...formData, labourCost: parseFloat(e.target.value) || 0 })}
                  className="w-full h-[44px] min-h-[44px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium transition-colors box-border"
                />
              </div>

              {/* Material Cost */}
              <div>
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Material Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.materialCost || ""}
                  onChange={(e) => setFormData({ ...formData, materialCost: parseFloat(e.target.value) || 0 })}
                  className="w-full h-[44px] min-h-[44px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium transition-colors box-border"
                />
              </div>

              {/* Service Charge */}
              <div>
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Service Charge
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.serviceCharge || ""}
                  onChange={(e) => setFormData({ ...formData, serviceCharge: parseFloat(e.target.value) || 0 })}
                  className="w-full h-[44px] min-h-[44px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium transition-colors box-border"
                />
              </div>

              {/* Tax */}
              <div>
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Tax
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.tax || ""}
                  onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                  className="w-full h-[44px] min-h-[44px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium transition-colors box-border"
                />
              </div>

              {/* Discount – full width */}
              <div className="md:col-span-2">
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Discount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.discount || ""}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  className="w-full h-[44px] min-h-[44px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium transition-colors box-border"
                />
              </div>

              {/* Remarks – full width */}
              <div className="md:col-span-2">
                <label className="block text-[13px] font-semibold leading-[18px] text-foreground mb-[6px]">
                  Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Add any specific conditions, notes or scope details for the client..."
                  value={formData.remarks || ""}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full p-[12px] px-[14px] rounded-[10px] bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm resize-y min-h-[100px] max-h-[140px] transition-colors box-border"
                />
              </div>
            </div>

            {/* ── Footer Actions ── */}
            <div className="flex items-center justify-end gap-3 pt-4 mt-5 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={prepareMutation.isPending}
                className="h-[42px] px-4 text-sm rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={prepareMutation.isPending}
                className="h-[42px] px-5 text-sm rounded-lg bg-teal-700 hover:bg-teal-800 text-white min-w-[120px] flex items-center justify-center gap-2 font-medium"
              >
                {prepareMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit RFQ</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Request Details Modal Component
function DetailModal({
  project: rawProject,
  onClose,
  onPrepareSuccess,
}: {
  project: ProjectRequest;
  onClose: () => void;
  onPrepareSuccess: () => void;
}) {
  const [isPrepareModalOpen, setIsPrepareModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const initialProject = (rawProject as any)?.data ?? (rawProject as any)?.project ?? rawProject;
  const projectId = String(initialProject._id || initialProject.id);

  // Background fetch to ensure the modal always displays the absolute latest status
  const { data: fetchedProject } = useQuery<ProjectRequest>({
    queryKey: ["project-request", projectId],
    queryFn: () => fetchProjectRequestById(projectId),
    initialData: initialProject,
    staleTime: 0,
  });

  const activeProject = (fetchedProject as any)?.data ?? (fetchedProject as any)?.project ?? fetchedProject ?? initialProject;

  // Single source of truth status normalizer
  const normalizedStatus = activeProject.status || activeProject.workflowStatus || activeProject.requestStatus || activeProject.quotationStatus || activeProject.jobStatus || "Submitted";

  const company = getCompanyDetails(activeProject);
  const category = getCategoryName(activeProject);
  const requester = getRequesterDetails(activeProject);
  const location = getLocationDetails(activeProject);
  const schedule = getScheduleDetails(activeProject);

  const rawDate = activeProject.createdAt || activeProject.submittedAt || activeProject.created_at || activeProject.date || activeProject.updatedAt || activeProject.timestamp;
  const { date } = formatSubmissionDate(rawDate);
  const reqNumber = activeProject.requestNumber || activeProject.reqNumber || activeProject.code || activeProject.id || activeProject._id;
  const title = activeProject.title || activeProject.projectName || activeProject.name || activeProject.description || "Project Request";

  // Mutation to transition status to "Rejected"
  const rejectMutation = useMutation({
    mutationFn: () => updateBookingDetails(projectId, { status: "Rejected" }),
    onSuccess: () => {
      toast.success("Request has been rejected.");
      queryClient.setQueryData(["project-request", projectId], (old: any) => {
        if (!old) return old;
        const merged = { ...(old?.data ?? old), status: "Rejected" };
        return old?.data ? { ...old, data: merged } : merged;
      });
      queryClient.invalidateQueries({ queryKey: ["project-requests"] });
      queryClient.invalidateQueries({ queryKey: ["project-request", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-project-requests"] });
      onPrepareSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reject request.");
    },
  });

  // Mutation to transition status to "Published"
  const publishMutation = useMutation({
    mutationFn: () => publishProjectJob(projectId),
    onSuccess: (res) => {
      toast.success(res.message || "Job has been published successfully.");
      queryClient.setQueryData(["project-request", projectId], (old: any) => {
        if (!old) return old;
        const merged = { ...(old?.data ?? old), ...res.project };
        return old?.data ? { ...old, data: merged } : merged;
      });
      queryClient.invalidateQueries({ queryKey: ["project-requests"] });
      queryClient.invalidateQueries({ queryKey: ["project-request", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-project-requests"] });
      onPrepareSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish job.");
    },
  });

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-3xl rounded-2xl bg-card border border-border shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                {reqNumber && (
                  <span className="text-xs font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {String(reqNumber)}
                  </span>
                )}
                {Boolean(normalizedStatus) && <StatusBadge status={String(normalizedStatus)} />}
                {Boolean(activeProject.priority) && <PriorityBadge priority={String(activeProject.priority)} />}
              </div>
              <h2 className="text-xl font-bold text-foreground mt-2 leading-tight">
                {String(title)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 text-sm">
            {/* Requester & Company Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Requester Details */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                  <UserIcon className="w-4 h-4 text-primary" /> Requester Details
                </h3>
                <div className="space-y-1">
                  <div>
                    <span className="text-xs text-muted-foreground">Name: </span>
                    <span className="font-semibold text-foreground">{requester.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Email: </span>
                    <span className="font-medium text-foreground">{requester.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Phone: </span>
                    <span className="font-medium text-foreground">{requester.phone}</span>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                  <Building2 className="w-4 h-4 text-primary" /> Company Details
                </h3>
                <div className="space-y-1">
                  <div>
                    <span className="text-xs text-muted-foreground">Company Name: </span>
                    <span className="font-semibold text-foreground">{company.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Company Email: </span>
                    <span className="font-medium text-foreground">{company.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                <FileText className="w-4 h-4 text-primary" /> Project Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-muted-foreground block">Request Number</span>
                  <span className="font-mono text-xs font-semibold text-foreground">{reqNumber ? String(reqNumber) : "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Category</span>
                  <span className="font-semibold text-foreground">{category}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground block">Project Title</span>
                  <span className="font-semibold text-foreground">{String(title)}</span>
                </div>
                {activeProject.description && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-muted-foreground block mb-1">Description</span>
                    <div className="p-3 rounded-lg bg-card border border-border/60 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {String(activeProject.description)}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground block">Priority</span>
                  <PriorityBadge priority={String(activeProject.priority ?? "Medium")} />
                </div>
              </div>
            </div>

            {/* Location & Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Location
                </h3>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Site Name</span>
                    <span className="font-medium text-foreground">{location.siteName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">City</span>
                    <span className="font-medium text-foreground">{location.city}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">State</span>
                    <span className="font-medium text-foreground">{location.state}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Country</span>
                    <span className="font-medium text-foreground">{location.country}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Pincode</span>
                    <span className="font-medium text-foreground">{location.pincode}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block">Address</span>
                    <span className="font-medium text-foreground">{location.address}</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                  <CalendarDays className="w-4 h-4 text-primary" /> Schedule
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Preferred Date</span>
                    <span className="font-medium text-foreground">{schedule.preferredDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Service Time</span>
                    <span className="font-medium text-foreground">{schedule.serviceTime}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Estimated Duration</span>
                    <span className="font-medium text-foreground">{schedule.estimatedDuration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {Array.isArray(activeProject.attachments) && activeProject.attachments.length > 0 && (
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/50 space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                  <Paperclip className="w-4 h-4 text-primary" /> Attachments
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeProject.attachments.map((att: any, i: number) => (
                    <AttachmentItem key={i} attachment={att} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
              {normalizedStatus === "Submitted" && (
                <>
                  <Button
                    variant="outline"
                    disabled={rejectMutation.isPending}
                    className="w-full sm:w-auto border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold px-5 py-2.5 rounded-xl transition-all"
                    onClick={() => { if (!rejectMutation.isPending) rejectMutation.mutate(); }}
                  >
                    {rejectMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                        <span>Rejecting...</span>
                      </>
                    ) : (
                      <span>Reject</span>
                    )}
                  </Button>
                  <Button
                    className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white font-semibold px-8 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-base transition-all"
                    onClick={() => setIsPrepareModalOpen(true)}
                  >
                    <Send className="w-5 h-5" />
                    <span>Prepare Quotation</span>
                  </Button>
                </>
              )}

              {normalizedStatus === "RFQ" && (
                <Button
                  disabled
                  className="w-full sm:w-auto opacity-80 bg-amber-500/10 text-amber-700 border border-amber-300 font-semibold px-6 py-2.5 rounded-xl cursor-not-allowed"
                >
                  <span>Waiting for Requester Response</span>
                </Button>
              )}

              {normalizedStatus === "Accepted" && (
                <Button
                  disabled={publishMutation.isPending}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-base transition-all"
                  onClick={() => { if (!publishMutation.isPending) publishMutation.mutate(); }}
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

              {normalizedStatus === "Published" && (
                <Button
                  disabled
                  className="w-full sm:w-auto bg-muted text-muted-foreground font-semibold px-8 py-2.5 rounded-xl cursor-not-allowed flex items-center gap-2 border border-border"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Published</span>
                </Button>
              )}

              {normalizedStatus === "Rejected" && (
                <Button
                  disabled
                  className="w-full sm:w-auto bg-red-50 text-red-600 border border-red-200 font-semibold px-8 py-2.5 rounded-xl cursor-not-allowed"
                >
                  <span>Rejected</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prepare RFQ Modal */}
      {isPrepareModalOpen && (
        <PrepareRFQModal
          projectId={projectId}
          onClose={() => setIsPrepareModalOpen(false)}
          onSuccess={() => {
            setIsPrepareModalOpen(false);
            onClose();
            onPrepareSuccess();
          }}
        />
      )}
    </>
  );
}

function ProjectRequestsPage() {
  const {
    requests,
    total,
    page,
    totalPages,
    isLoading,
    isError,
    selectedProject,
    detailLoading,
    handleSearch,
    handleStatusFilter,
    handleSort,
    statusFilter,
    openDetail,
    closeDetail,
    setPage,
  } = useProjectsController();

  const [clientSearch, setClientSearch] = useState("");
  const [clientSortDir, setClientSortDir] = useState<"desc" | "asc">("desc");

  // Client-side fallback search & filter for requestNumber, companyName, companyEmail, title, categoryName
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    if (clientSearch.trim()) {
      const q = clientSearch.trim().toLowerCase();
      result = result.filter((req) => {
        const reqNum = String(req.requestNumber ?? req._id ?? "").toLowerCase();
        const title = String(req.title ?? req.description ?? "").toLowerCase();
        const category = getCategoryName(req).toLowerCase();
        const { name, email } = getCompanyDetails(req);
        const compName = name.toLowerCase();
        const compEmail = email.toLowerCase();

        return (
          reqNum.includes(q) ||
          title.includes(q) ||
          category.includes(q) ||
          compName.includes(q) ||
          compEmail.includes(q)
        );
      });
    }

    // Newest submitted request first (sorting)
    result.sort((a, b) => {
      const dateA = new Date(String(a.createdAt ?? a.submittedAt ?? 0)).getTime();
      const dateB = new Date(String(b.createdAt ?? b.submittedAt ?? 0)).getTime();
      return clientSortDir === "desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [requests, clientSearch, clientSortDir]);

  const toggleSort = () => {
    const nextDir = clientSortDir === "desc" ? "asc" : "desc";
    setClientSortDir(nextDir);
    handleSort(nextDir === "desc" ? "-createdAt" : "createdAt");
  };

  const handleSearchChange = (val: string) => {
    setClientSearch(val);
    handleSearch(val);
  };

  const STATUSES = ["Submitted", "RFQ", "Accepted", "Published", "Assigned", "Completed", "Cancelled", "Rejected"];

  const queryClient = useQueryClient();

  const handlePrepareSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["project-requests"] });
    queryClient.invalidateQueries({ queryKey: ["recent-project-requests"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    if (selectedProject) {
      const id = String((selectedProject as any)._id || (selectedProject as any).id);
      queryClient.invalidateQueries({ queryKey: ["project-request", id] });
    }
    closeDetail();
  };

  return (
    <AppShell
      title="Admin Project Requests"
      subtitle="Overview of all submitted project requests from client companies."
    >
      {/* Detail Modal */}
      {selectedProject && (
        <DetailModal
          project={selectedProject}
          onClose={closeDetail}
          onPrepareSuccess={handlePrepareSuccess}
        />
      )}
      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs">
          <div className="bg-card border border-border p-4 rounded-xl shadow-xl flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading project details...</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by RFQ ID, company, title, or service..."
              value={clientSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-secondary/50 border border-border/80 focus:border-primary focus:bg-card outline-none text-sm placeholder:text-muted-foreground transition-all"
            />
            {clientSearch && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Badges/Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">
              Status:
            </span>
            <button
              onClick={() => handleStatusFilter("")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                statusFilter === ""
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              All
            </button>
            {STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => handleStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="rounded-xl border border-border overflow-hidden shadow-sm bg-card">
        <div className="relative w-full overflow-x-auto max-h-[calc(100vh-280px)]">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-muted/90 backdrop-blur-md shadow-xs border-b border-border">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-[140px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  RFQ ID
                </TableHead>
                <TableHead className="min-w-[220px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Company
                </TableHead>
                <TableHead className="min-w-[150px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Service
                </TableHead>
                <TableHead className="min-w-[200px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Project
                </TableHead>
                <TableHead className="w-[110px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Priority
                </TableHead>
                <TableHead className="w-[130px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Status
                </TableHead>
                <TableHead className="w-[150px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  <button
                    onClick={toggleSort}
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none"
                    title="Click to change date sort order"
                  >
                    <span>Submitted</span>
                    {clientSortDir === "desc" ? (
                      <ArrowDown className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5 text-primary" />
                    )}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-border/60">
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                // Error State
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center py-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        Failed to load project requests
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        There was an error communicating with the backend server.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                // Empty State
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center py-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-secondary grid place-items-center mb-3 text-muted-foreground">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        No project requests found
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {clientSearch || statusFilter
                          ? "Try adjusting your search criteria or status filters."
                          : "No project requests have been submitted yet."}
                      </p>
                      {(clientSearch || statusFilter) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            handleSearchChange("");
                            handleStatusFilter("");
                          }}
                          className="mt-3 text-xs"
                        >
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Data Rows
                filteredRequests.map((req) => {
                  const company = getCompanyDetails(req);
                  const category = getCategoryName(req);
                  const rawDate = req.createdAt || req.submittedAt || req.created_at || req.date || req.updatedAt || req.timestamp;
                  const { date, time } = formatSubmissionDate(rawDate);
                  const reqIdDisplay = String(req.requestNumber || req.reqNumber || req.code || req._id || req.id);

                  return (
                    <TableRow
                      key={String(req._id || req.id)}
                      onClick={() => openDetail(String(req._id || req.id), req)}
                      className="cursor-pointer hover:bg-muted/60 transition-colors border-border/60"
                    >
                      {/* Column 1: RFQ ID */}
                      <TableCell className="font-mono text-xs font-medium text-foreground py-3.5">
                        {reqIdDisplay}
                      </TableCell>

                      {/* Column 2: Company */}
                      <TableCell className="py-3.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-foreground line-clamp-1">
                            {company.name}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {company.email}
                          </span>
                        </div>
                      </TableCell>

                      {/* Column 3: Service */}
                      <TableCell className="text-sm font-medium text-foreground/90 py-3.5">
                        {category}
                      </TableCell>

                      {/* Column 4: Project */}
                      <TableCell className="text-sm font-medium text-foreground py-3.5">
                        <span
                          className="line-clamp-2"
                          title={String(req.title ?? req.description ?? "—")}
                        >
                          {String(req.title ?? req.description ?? "—")}
                        </span>
                      </TableCell>

                      {/* Column 5: Priority */}
                      <TableCell className="py-3.5">
                        <PriorityBadge priority={String(req.priority ?? "Medium")} />
                      </TableCell>

                      {/* Column 6: Status */}
                      <TableCell className="py-3.5">
                        <StatusBadge status={String(req.status ?? "Submitted")} />
                      </TableCell>

                      {/* Column 7: Submitted (Immediately after Status) */}
                      <TableCell className="py-3.5">
                        <div className="flex flex-col leading-tight">
                          <span className="text-xs font-semibold text-foreground">{date}</span>
                          {time && (
                            <span className="text-[11px] font-normal text-muted-foreground mt-0.5">
                              {time}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer / Pagination Controls */}
        <div className="px-4 py-3 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{filteredRequests.length}</span>{" "}
            of <span className="font-medium text-foreground">{total}</span> project requests
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs mr-1">
                Page <span className="font-medium text-foreground">{page}</span> of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage(1)}
                  className="h-8 w-8 p-0"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 w-8 p-0"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage(totalPages)}
                  className="h-8 w-8 p-0"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </AppShell>
  );
}
