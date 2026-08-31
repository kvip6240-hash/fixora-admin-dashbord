import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, Button } from "@/components/app-shell";
import {
  Users,
  Briefcase,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Layers,
  Download,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchUsersCount,
  fetchServiceProvidersCount,
  fetchCategoriesCount,
  fetchProjectRequests,
  fetchActiveBookings,
  fetchPendingBookings,
  type ProjectRequest,
} from "@/lib/api";
import { useMemo } from "react";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { RecentBookingsTable } from "@/components/dashboard/RecentBookingsTable";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Enterprise Dashboard — Fixora Admin" },
      { name: "description", content: "Executive overview for Fixora operations and bookings." },
    ],
  }),
  component: Dashboard,
} as any));

function Dashboard() {
  const navigate = useNavigate();

  // ── Stat counts ──
  const { data: usersCountData, isLoading: usersLoading } = useQuery({
    queryKey: ["users-count-stat"],
    queryFn: fetchUsersCount,
    staleTime: 30_000,
  });

  const { data: providersCountData, isLoading: providersLoading } = useQuery({
    queryKey: ["service-providers-count-stat"],
    queryFn: fetchServiceProvidersCount,
    staleTime: 30_000,
  });

  const { data: categoriesCountData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories-count-stat"],
    queryFn: fetchCategoriesCount,
    staleTime: 30_000,
  });

  const { data: activeBookingsData, isLoading: activeLoading } = useQuery({
    queryKey: ["active-bookings-stat"],
    queryFn: fetchActiveBookings,
    staleTime: 30_000,
  });

  const { data: pendingBookingsData, isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-bookings-stat"],
    queryFn: fetchPendingBookings,
    staleTime: 30_000,
  });

  // ── Recent project requests (newest first, limit 10) ──
  const {
    data: recentRequestsData,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ["recent-project-requests"],
    queryFn: () => fetchProjectRequests({ page: 1, limit: 10, sort: "-createdAt" }),
    staleTime: 20_000,
  });

  // Sort newest first client-side as safety net
  const recentBookings: ProjectRequest[] = useMemo(() => {
    const items = recentRequestsData?.data ?? [];
    return [...items].sort((a, b) => {
      const da = new Date((a as any).createdAt || (a as any).submittedAt || 0).getTime();
      const db = new Date((b as any).createdAt || (b as any).submittedAt || 0).getTime();
      return db - da;
    });
  }, [recentRequestsData]);

  // ── Summary cards ──
  const summaryCards = useMemo(() => {
    const totalUsers = usersLoading ? "..." : (usersCountData?.count ?? 0).toLocaleString();
    const totalProviders = providersLoading ? "..." : (providersCountData?.count ?? 0).toLocaleString();
    const totalCategories = categoriesLoading ? "..." : `${categoriesCountData?.count ?? 0} Active`;
    const activeCount = activeLoading ? "..." : (activeBookingsData?.count ?? 0).toLocaleString();
    const pendingCount = pendingLoading ? "..." : (pendingBookingsData?.count ?? 0).toLocaleString();

    return [
      {
        title: "Total Users",
        value: totalUsers,
        change: "+12.5%",
        isPositive: true,
        icon: Users,
        iconBg: "bg-blue-50",
        iconColor: "text-[#2563EB]",
        to: "/admin/users",
      },
      {
        title: "Service Providers",
        value: totalProviders,
        change: "+8.2%",
        isPositive: true,
        icon: Briefcase,
        iconBg: "bg-indigo-50",
        iconColor: "text-indigo-600",
        to: "/admin/service-providers",
      },
      {
        title: "Active Bookings",
        value: activeCount,
        change: "+5.4%",
        isPositive: true,
        icon: CalendarCheck,
        iconBg: "bg-emerald-50",
        iconColor: "text-[#10B981]",
        to: "/projects",
      },
      {
        title: "Pending Bookings",
        value: pendingCount,
        change: "-2.1%",
        isPositive: false,
        icon: Clock,
        iconBg: "bg-amber-50",
        iconColor: "text-[#F59E0B]",
        to: "/projects",
      },
      {
        title: "Completed Services",
        value: "18,940",
        change: "+14.8%",
        isPositive: true,
        icon: CheckCircle2,
        iconBg: "bg-teal-50",
        iconColor: "text-teal-600",
      },
      {
        title: "Categories",
        value: totalCategories,
        change: "+4",
        isPositive: true,
        icon: Layers,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
        to: "/admin/categories",
      },
    ];
  }, [usersCountData, usersLoading, providersCountData, providersLoading, categoriesCountData, categoriesLoading]);

  return (
    <AppShell
      title="Executive Overview"
      subtitle="Real-time control center for platform bookings, revenue, and service operations."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm">
            <Download className="w-3.5 h-3.5" />
            Export Report
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* SECTION 1: TOP SUMMARY CARDS */}
        <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </div>

        {/* SECTION 2: RECENT BOOKINGS — navigates to booking detail page on click */}
        <RecentBookingsTable
          bookings={recentBookings}
          isLoading={requestsLoading}
          onView={(project) => {
            const id = String((project as any)._id || (project as any).id);
            navigate({ to: `/admin/bookings/${id}` });
          }}
          onViewAll={() => navigate({ to: "/projects" })}
        />
      </div>
    </AppShell>
  );
}
