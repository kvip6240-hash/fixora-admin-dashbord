import { Eye } from "lucide-react";
import { Card, SectionHeader, Button } from "@/components/app-shell";
import { BookingListItem } from "@/lib/api";

const statusBadges: Record<string, { bg: string; text: string; dot: string }> = {
  Pending: { bg: "bg-[#FFF7ED] border-[#FFEDD5]", text: "text-[#C2410C]", dot: "bg-[#F59E0B]" },
  Accepted: { bg: "bg-[#EFF6FF] border-[#DBEAFE]", text: "text-[#1D4ED8]", dot: "bg-[#2563EB]" },
  Completed: { bg: "bg-[#ECFDF5] border-[#D1FAE5]", text: "text-[#047857]", dot: "bg-[#10B981]" },
  Cancelled: { bg: "bg-[#FEF2F2] border-[#FEE2E2]", text: "text-[#B91C1C]", dot: "bg-[#EF4444]" },
  Draft: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400" },
  Submitted: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  "In Progress": { bg: "bg-sky-50 border-sky-200", text: "text-sky-700", dot: "bg-sky-500" },
  Rejected: { bg: "bg-red-50 border-red-200", text: "text-red-700", dot: "bg-red-500" },
};

function getBadge(status: string) {
  return statusBadges[status] || statusBadges["Pending"];
}

export function RecentBookingsTable({
  bookings,
  onView,
}: {
  bookings: BookingListItem[];
  onView?: (booking: BookingListItem) => void;
}) {
  return (
    <Card className="p-5 border-border/80 bg-white">
      <SectionHeader
        title="Recent Bookings"
        hint="Manage platform service requests and orders"
        action={
          <Button variant="outline" size="sm">
            View All
          </Button>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th className="py-3 px-4 rounded-l-lg">Booking ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Provider</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right rounded-r-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No recent bookings found.
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const badge = getBadge(b.status);
                return (
                  <tr
                    key={b._id}
                    onClick={() => onView?.(b)}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{b.bookingId}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{b.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{b.providerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{b.service}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {new Date(b.bookingDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onView?.(b);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
