import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { AppShell, Button, Card, SectionHeader } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBookingDetails, updateBookingDetails, fetchServiceProviders } from "@/lib/api";
import { useState, useMemo } from "react";
import { ArrowLeft, User, Briefcase, MapPin, Clock, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/bookings/$bookingId")({
  component: BookingDetailsPage,
});

function BookingDetailsPage() {
  const { bookingId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAssignProviderModalOpen, setIsAssignProviderModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");

  const { data: bookingData, isLoading } = useQuery({
    queryKey: ["booking-details", bookingId],
    queryFn: () => fetchBookingDetails(bookingId),
    enabled: !!bookingId,
  });

  const { data: providersData } = useQuery({
    queryKey: ["active-providers-list"],
    queryFn: () => fetchServiceProviders({ limit: 100, isActive: true }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) => updateBookingDetails(bookingId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-details", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["recent-bookings-list"] });
    },
  });

  const assignProviderMutation = useMutation({
    mutationFn: (providerId: string) => updateBookingDetails(bookingId, { assignedProvider: providerId }),
    onSuccess: () => {
      setIsAssignProviderModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["booking-details", bookingId] });
    },
  });

  const booking = bookingData?.data;

  if (isLoading) {
    return (
      <AppShell title="Booking Details" subtitle="Loading booking information...">
        <div className="flex justify-center items-center h-64 text-slate-500">Loading...</div>
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

  return (
    <AppShell
      title={`Booking ${booking.requestNumber || booking._id}`}
      subtitle={`Created on ${new Date(booking.createdAt).toLocaleString()}`}
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
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Service Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Service Category</p>
                <p className="font-medium">{booking.categoryId?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Title</p>
                <p className="font-medium">{booking.title}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-slate-500">Description</p>
                <p className="font-medium text-sm mt-1 p-3 bg-slate-50 rounded-lg whitespace-pre-wrap">
                  {booking.description || "No description provided."}
                </p>
              </div>
            </div>
          </Card>

          {/* Customer Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Customer Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Company / Name</p>
                <p className="font-medium">{booking.requesterId?.companyName || booking.requesterId?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Contact</p>
                <p className="font-medium">{booking.requesterId?.phone || booking.requesterId?.email || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-slate-500">Location</p>
                <p className="font-medium flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {booking.requesterId?.address || "Address not provided"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Status & Provider */}
        <div className="space-y-6">
          <Card className="p-6 border-blue-100 bg-blue-50/30">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Status & Actions</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Current Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                  {booking.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Payment Status</p>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-700">
                  {booking.paymentStatus}
                </span>
              </div>
              
              <hr className="border-slate-200" />
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" size="sm" className="w-full justify-center bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => updateStatusMutation.mutate("Accepted")}
                    disabled={updateStatusMutation.isPending || booking.status === "Accepted"}
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="outline" size="sm" className="w-full justify-center bg-white text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => updateStatusMutation.mutate("Rejected")}
                    disabled={updateStatusMutation.isPending || booking.status === "Rejected"}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="outline" size="sm" className="w-full justify-center bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => updateStatusMutation.mutate("In Progress")}
                    disabled={updateStatusMutation.isPending || booking.status === "In Progress"}
                  >
                    In Progress
                  </Button>
                  <Button 
                    variant="outline" size="sm" className="w-full justify-center bg-white text-teal-600 border-teal-200 hover:bg-teal-50"
                    onClick={() => updateStatusMutation.mutate("Completed")}
                    disabled={updateStatusMutation.isPending || booking.status === "Completed"}
                  >
                    Complete
                  </Button>
                  <Button 
                    variant="outline" size="sm" className="col-span-2 justify-center bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    onClick={() => updateStatusMutation.mutate("Cancelled")}
                    disabled={updateStatusMutation.isPending || booking.status === "Cancelled"}
                  >
                    Cancel Booking
                  </Button>
                </div>
              </div>
            </div>
          </Card>


        </div>
      </div>

      {/* Assign Provider Modal */}
      {isAssignProviderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Assign Service Provider</h3>
            <p className="text-sm text-slate-500 mb-4">Select a provider to handle this service request.</p>
            
            <select
              className="w-full p-2.5 border border-slate-200 rounded-lg mb-6"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <option value="">-- Select a Provider --</option>
              {providersData?.data?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.companyName || p.name}
                </option>
              ))}
            </select>
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsAssignProviderModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                disabled={!selectedProvider || assignProviderMutation.isPending}
                onClick={() => assignProviderMutation.mutate(selectedProvider)}
              >
                Assign
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Bottom Action Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-slate-200/90 backdrop-blur border-t border-slate-300 px-6 py-4 flex items-center justify-end gap-4 mt-8 rounded-b-xl shadow-lg">
        <Button
          variant="outline"
          className="border-none text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent font-medium"
          onClick={() => updateStatusMutation.mutate("Rejected")}
          disabled={updateStatusMutation.isPending || booking.status === "Rejected"}
        >
          Reject Request
        </Button>
        <Button
          className="bg-teal-700 hover:bg-teal-800 text-white font-medium px-6 py-2 rounded-lg shadow-sm"
          onClick={() => {
            /* Handle prepare quotation action or navigate */
          }}
        >
          Prepare Quotation
        </Button>
      </div>
    </AppShell>
  );
}
