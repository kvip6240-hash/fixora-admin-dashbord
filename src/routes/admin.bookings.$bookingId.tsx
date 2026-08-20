import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Button, Card, SectionHeader } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBookingDetails, updateBookingDetails, prepareProjectQuotation, publishProjectJob, getAttachmentUrl, type PrepareQuotationPayload } from "@/lib/api";
import { useState } from "react";
import {
  ArrowLeft,
  User,
  Building2,
  MapPin,
  Clock,
  FileText,
  Calendar,
  Paperclip,
  Download,
  Send,
  Loader2,
  FileCheck,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/bookings/$bookingId")({
  component: BookingDetailsPage,
});

// ─── Helpers to extract data safely ───────────────────────────────────────────

function getRequesterDetails(booking: any) {
  const req = booking?.requesterId || {};
  return {
    name: req.name || req.fullName || booking?.requesterName || "—",
    email: req.email || booking?.requesterEmail || "—",
    phone: req.phone || booking?.requesterPhone || "—",
  };
}

function getCompanyDetails(booking: any) {
  const req = booking?.requesterId || {};
  return {
    name: req.companyName || booking?.companyName || "—",
    email: req.companyEmail || booking?.companyEmail || req.email || "—",
  };
}

function getLocationDetails(booking: any) {
  const loc = booking?.location || {};
  if (typeof loc === "string") {
    return { siteName: "—", address: loc, city: "—", state: "—", country: "—", pincode: "—" };
  }
  return {
    siteName: loc.siteName || booking?.siteName || "—",
    address: loc.address || booking?.address || "—",
    city: loc.city || booking?.city || "—",
    state: loc.state || booking?.state || "—",
    country: loc.country || booking?.country || "—",
    pincode: loc.pincode || booking?.pincode || "—",
  };
}

function getScheduleDetails(booking: any) {
  const sched = booking?.schedule || {};
  if (typeof sched === "string") {
    return { preferredDate: sched, serviceTime: "—", estimatedDuration: "—" };
  }
  return {
    preferredDate: sched.preferredDate || booking?.preferredDate || "—",
    serviceTime: sched.serviceTime || booking?.serviceTime || "—",
    estimatedDuration: sched.estimatedDuration || booking?.estimatedDuration || "—",
  };
}

function formatDateTime(rawDate?: string) {
  if (!rawDate) return { date: "—", time: "—" };
  try {
    const d = new Date(rawDate);
    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  } catch {
    return { date: "—", time: "—" };
  }
}

// ─── Status & Priority Badge Styling ──────────────────────────────────────────

const STATUS_CLASSES: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-700 border-blue-200 hover:bg-blue-500/20",
  rfq:       "bg-purple-500/15 text-purple-700 border-purple-200 hover:bg-purple-500/20",
  accepted:  "bg-teal-500/15 text-teal-700 border-teal-200 hover:bg-teal-500/20",
  published: "bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/20",
  assigned:  "bg-indigo-500/15 text-indigo-700 border-indigo-200 hover:bg-indigo-500/20",
  completed: "bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20",
  cancelled: "bg-slate-500/15 text-slate-600 border-slate-200 hover:bg-slate-500/15",
  rejected:  "bg-red-500/15 text-red-700 border-red-200 hover:bg-red-500/20",
};

function StatusPill({ status }: { status?: string }) {
  const key = (status ?? "Submitted").trim().toLowerCase();
  const cls = STATUS_CLASSES[key] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <Badge className={`${cls} font-medium shadow-none border`}>
      {status || "Submitted"}
    </Badge>
  );
}

const PRIORITY_CLASSES: Record<string, string> = {
  high:      "bg-red-500/15 text-red-700 border-red-200 hover:bg-red-500/20",
  emergency: "bg-rose-950 text-rose-100 border-rose-900 hover:bg-rose-900",
  medium:    "bg-orange-500/15 text-orange-700 border-orange-200 hover:bg-orange-500/20",
  low:       "bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20",
};

function PriorityPill({ priority }: { priority?: string }) {
  const key = (priority ?? "Medium").trim().toLowerCase();
  const cls = PRIORITY_CLASSES[key] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <Badge className={`${cls} font-medium shadow-none border`}>
      {priority || "Medium"}
    </Badge>
  );
}

// ─── Prepare RFQ Modal Component ──────────────────────────────────────────────

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
      toast.error(err.message || "Failed to submit RFQ. Please check your inputs and try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      errs.amount = "Amount must be greater than 0";
    }
    if (!formData.currency) {
      errs.currency = "Currency is required";
    }
    if (!formData.estimatedDuration) {
      errs.estimatedDuration = "Estimated duration is required";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    mutation.mutate(formData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Prepare RFQ</h2>
              <p className="text-xs text-muted-foreground">Specify commercial terms and submit quotation details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <XCircle className="w-5 h-5" />
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
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium"
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
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium"
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
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm font-medium"
              >
                <option value="1 Day">1 Day</option>
                <option value="2 Days">2 Days</option>
                <option value="3 Days">3 Days</option>
                <option value="1 Week">1 Week</option>
                <option value="2 Weeks">2 Weeks</option>
              </select>
              {errors.estimatedDuration && <p className="text-xs text-red-500 mt-1">{errors.estimatedDuration}</p>}
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Hourly Rate
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.hourlyRate || ""}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm"
              />
            </div>

            {/* Labour Cost */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Labour Cost
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.labourCost || ""}
                onChange={(e) => setFormData({ ...formData, labourCost: parseFloat(e.target.value) || 0 })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm"
              />
            </div>

            {/* Material Cost */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Material Cost
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.materialCost || ""}
                onChange={(e) => setFormData({ ...formData, materialCost: parseFloat(e.target.value) || 0 })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm"
              />
            </div>

            {/* Service Charge */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Service Charge
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.serviceCharge || ""}
                onChange={(e) => setFormData({ ...formData, serviceCharge: parseFloat(e.target.value) || 0 })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm"
              />
            </div>

            {/* Tax */}
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Tax
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.tax || ""}
                onChange={(e) => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm"
              />
            </div>

            {/* Discount */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Discount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.discount || ""}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm"
              />
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Add any specific conditions, notes or scope details for the client..."
                value={formData.remarks || ""}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full p-3 rounded-lg bg-secondary/50 border border-border focus:border-primary focus:bg-card outline-none text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-teal-700 hover:bg-teal-800 text-white min-w-[130px] flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
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
  );
}

// ─── Main Details Page Component ──────────────────────────────────────────────

function BookingDetailsPage() {
  const { bookingId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isPrepareRFQModalOpen, setIsPrepareRFQModalOpen] = useState(false);

  const { data: bookingData, isLoading, refetch } = useQuery({
    queryKey: ["booking-details", bookingId],
    queryFn: () => fetchBookingDetails(bookingId),
    enabled: !!bookingId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => updateBookingDetails(bookingId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-details", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["recent-project-requests"] });
      toast.success("Request status updated successfully.");
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishProjectJob(bookingId),
    onSuccess: (res) => {
      toast.success(res.message || "Job has been published successfully.");
      queryClient.setQueryData(["booking-details", bookingId], (old: any) => {
        if (!old) return old;
        return { ...old, data: { ...old.data, ...res.project } };
      });
      queryClient.invalidateQueries({ queryKey: ["booking-details", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["project-requests"] });
      queryClient.invalidateQueries({ queryKey: ["recent-project-requests"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish job.");
    },
  });

  const booking = bookingData?.data;

  if (isLoading) {
    return (
      <AppShell title="Booking Details" subtitle="Loading booking information...">
        <div className="flex justify-center items-center h-64 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
        </div>
      </AppShell>
    );
  }

  if (!booking) {
    return (
      <AppShell title="Booking Details" subtitle="Error loading booking">
        <div className="text-red-500 text-center py-12">Booking not found or an error occurred.</div>
      </AppShell>
    );
  }

  const requester = getRequesterDetails(booking);
  const company = getCompanyDetails(booking);
  const location = getLocationDetails(booking);
  const schedule = getScheduleDetails(booking);
  const { date: submittedDate, time: submittedTime } = formatDateTime(String(booking.createdAt || booking.submittedAt || ""));
  const requestNumber = booking.requestNumber || booking._id?.slice(-6)?.toUpperCase() || "—";
  const priority = booking.priority || "Medium";

  return (
    <AppShell
      title={`Request ${requestNumber}`}
      subtitle={`Created on ${submittedDate} at ${submittedTime}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-white" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Project Details, Location, Attachments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
              <FileText className="w-5 h-5 text-teal-700" />
              Project Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Request Number</p>
                <p className="font-mono text-sm font-semibold text-slate-800 mt-0.5">{requestNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Category</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{String(booking.categoryId?.name || booking.service || "—")}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Project Title</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{booking.title || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Description</p>
                <p className="text-sm mt-1 p-3 bg-slate-50 border border-slate-100 rounded-lg whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {booking.description || "No description provided."}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Priority</p>
                <PriorityPill priority={priority} />
              </div>
            </div>
          </Card>

          {/* Location Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
              <MapPin className="w-5 h-5 text-teal-700" />
              Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Site Name</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{location.siteName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Pincode</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{location.pincode}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Address</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{location.address}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">City</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{location.city}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">State</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{location.state}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Country</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{location.country}</p>
              </div>
            </div>
          </Card>

          {/* Attachments Section */}
          {Array.isArray(booking.attachments) && booking.attachments.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
                <Paperclip className="w-5 h-5 text-teal-700" />
                Attachments
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {booking.attachments.map((url: string, i: number) => {
                  const fullUrl = getAttachmentUrl(url);
                  const isPdf = typeof url === "string" && url.toLowerCase().includes(".pdf");
                  return (
                    <div key={i} className="p-3 rounded-lg bg-card border border-border flex flex-col items-center justify-between text-center gap-2 group hover:shadow-md transition-shadow">
                      {isPdf ? (
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-1 py-2 hover:opacity-80 transition-opacity"
                        >
                          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-red-100">
                            PDF
                          </div>
                          <span className="text-xs font-medium text-foreground truncate max-w-[120px]">
                            Document #{i + 1}
                          </span>
                        </a>
                      ) : (
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full h-24 rounded overflow-hidden bg-muted border block"
                        >
                          <img
                            src={fullUrl}
                            alt={`Attachment ${i + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </a>
                      )}
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="w-full py-1.5 px-2 rounded bg-secondary hover:bg-secondary/80 text-xs font-semibold text-teal-800 flex items-center justify-center gap-1.5 transition-colors border"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

        </div>

        {/* RIGHT COLUMN: Requester, Company, Schedule, Status */}
        <div className="space-y-6">
          
          {/* Status Details */}
          <Card className="p-6 border-blue-50 bg-blue-50/10">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-700" />
              Status & Info
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status</p>
                <div className="mt-1">
                  <StatusPill status={booking.status} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Submitted Date</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{submittedDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Submitted Time</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{submittedTime}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Payment Status</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{booking.paymentStatus || "—"}</p>
              </div>

              <hr className="border-slate-200" />

              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs font-semibold"
                    onClick={() => updateStatusMutation.mutate("Accepted")}
                    disabled={updateStatusMutation.isPending || booking.status === "Accepted"}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center bg-white text-red-600 border-red-200 hover:bg-red-50 text-xs font-semibold"
                    onClick={() => updateStatusMutation.mutate("Rejected")}
                    disabled={updateStatusMutation.isPending || booking.status === "Rejected"}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center bg-white text-blue-600 border-blue-200 hover:bg-blue-50 text-xs font-semibold"
                    onClick={() => updateStatusMutation.mutate("In Progress")}
                    disabled={updateStatusMutation.isPending || booking.status === "In Progress"}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-center bg-white text-teal-600 border-teal-200 hover:bg-teal-50 text-xs font-semibold"
                    onClick={() => updateStatusMutation.mutate("Completed")}
                    disabled={updateStatusMutation.isPending || booking.status === "Completed"}
                  >
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="col-span-2 justify-center bg-white text-slate-600 border-slate-200 hover:bg-slate-50 text-xs font-semibold"
                    onClick={() => updateStatusMutation.mutate("Cancelled")}
                    disabled={updateStatusMutation.isPending || booking.status === "Cancelled"}
                  >
                    Cancel Booking
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Requester Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
              <User className="w-5 h-5 text-teal-700" />
              Requester Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Name</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{requester.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{requester.email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Phone</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{requester.phone}</p>
              </div>
            </div>
          </Card>

          {/* Company Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
              <Building2 className="w-5 h-5 text-teal-700" />
              Company Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Company Name</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{company.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Company Email</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{company.email}</p>
              </div>
            </div>
          </Card>

          {/* Schedule */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
              <Calendar className="w-5 h-5 text-teal-700" />
              Schedule
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Preferred Date</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{schedule.preferredDate}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Service Time</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{schedule.serviceTime}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Estimated Duration</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{schedule.estimatedDuration}</p>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-slate-200/95 backdrop-blur-md border-t border-slate-300 px-6 py-4 flex items-center justify-end gap-4 mt-8 rounded-b-xl shadow-lg z-40">
        {booking.status === "Submitted" && (
          <>
            <Button
              variant="outline"
              className="border-none text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent font-semibold text-sm"
              onClick={() => updateStatusMutation.mutate("Rejected")}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <span>Reject Request</span>
              )}
            </Button>
            <Button
              className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-8 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors text-sm"
              onClick={() => setIsPrepareRFQModalOpen(true)}
            >
              <Send className="w-4 h-4" />
              <span>Prepare Quotation</span>
            </Button>
          </>
        )}

        {booking.status === "RFQ" && (
          <Button disabled className="opacity-80 bg-amber-500/10 text-amber-700 border border-amber-300 font-semibold text-sm">
            Waiting for Requester Response
          </Button>
        )}

        {booking.status === "Accepted" && (
          <Button
            disabled={publishMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-colors text-sm"
            onClick={() => publishMutation.mutate()}
          >
            {publishMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Publish Job</span>
              </>
            )}
          </Button>
        )}

        {booking.status === "Published" && (
          <Button disabled className="bg-muted text-muted-foreground font-semibold text-sm cursor-not-allowed flex items-center gap-1.5 border border-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Published</span>
          </Button>
        )}

        {booking.status === "Rejected" && (
          <Button disabled className="bg-red-50 text-red-600 border border-red-200 font-semibold text-sm cursor-not-allowed">
            <span>Rejected</span>
          </Button>
        )}
      </div>

      {/* Prepare RFQ Modal */}
      {isPrepareRFQModalOpen && (
        <PrepareRFQModal
          projectId={bookingId}
          onClose={() => setIsPrepareRFQModalOpen(false)}
          onSuccess={() => {
            setIsPrepareRFQModalOpen(false);
            refetch();
          }}
        />
      )}
    </AppShell>
  );
}
