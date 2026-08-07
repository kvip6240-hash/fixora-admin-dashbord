import { Bell, ShieldAlert, LifeBuoy, CheckCircle2, Clock } from "lucide-react";
import { Card, SectionHeader, Button } from "@/components/app-shell";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
}

export interface ApprovalItem {
  id: string;
  applicant: string;
  type: "Provider Verification" | "Company Onboarding" | "Service Addition";
  date: string;
}

export interface SupportTicketItem {
  id: string;
  subject: string;
  user: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In Progress";
}

export function NotificationPanel({
  notifications,
  approvals,
  tickets,
}: {
  notifications: NotificationItem[];
  approvals: ApprovalItem[];
  tickets: SupportTicketItem[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Notifications */}
      <Card className="p-5 border-border/80 bg-white">
        <SectionHeader
          title="Recent Notifications"
          hint="System alerts & updates"
          action={
            <span className="text-xs font-semibold text-[#2563EB] cursor-pointer hover:underline">
              Mark all read
            </span>
          }
        />
        <div className="space-y-3.5 mt-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 rounded-xl border ${
                n.unread ? "bg-blue-50/50 border-blue-100" : "bg-slate-50 border-slate-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#2563EB]" />
                  <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                </div>
                <span className="text-[10px] text-slate-400">{n.time}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{n.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Pending Approvals */}
      <Card className="p-5 border-border/80 bg-white">
        <SectionHeader title="Pending Approvals" hint="KYC & verification queue" />
        <div className="space-y-3.5 mt-3">
          {approvals.map((app) => (
            <div
              key={app.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-slate-900 block">{app.applicant}</span>
                <span className="text-[11px] text-slate-500 block">{app.type}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{app.date}</span>
              </div>
              <div className="flex flex-col gap-1">
                <Button variant="primary" size="sm" className="h-7 text-[11px] px-2.5">
                  Approve
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5">
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Support Tickets */}
      <Card className="p-5 border-border/80 bg-white">
        <SectionHeader title="Latest Support Tickets" hint="Open inquiries" />
        <div className="space-y-3.5 mt-3">
          {tickets.map((t) => (
            <div key={t.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{t.id}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.priority === "High"
                      ? "bg-red-50 text-red-600"
                      : t.priority === "Medium"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {t.priority}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-800 mt-1 line-clamp-1">{t.subject}</p>
              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                <span>By: {t.user}</span>
                <span className="text-[#2563EB] font-medium">{t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
