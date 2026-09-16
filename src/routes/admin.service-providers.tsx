import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, Card, Button } from "@/components/app-shell";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Building2,
  CalendarDays,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  ShieldCheck,
  ShieldX,
  Layers,
  MapPin,
} from "lucide-react";
import {
  fetchServiceProviders,
  updateServiceProvider,
  deleteServiceProvider,
  updateServiceProviderStatus,
  type ServiceProvider,
} from "@/lib/api";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/service-providers")({
  head: () => ({
    meta: [
      { title: "Manage Service Providers — Versal Axis Admin" },
      {
        name: "description",
        content:
          "Executive management console for all service providers on the Versal Axis platform.",
      },
    ],
  }),
  component: AdminServiceProvidersPage,
});

function formatRegDate(createdAt?: string): string {
  if (!createdAt) return "—";
  try {
    const d = new Date(createdAt);
    if (isNaN(d.getTime())) return String(createdAt);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(createdAt);
  }
}

function AdminServiceProvidersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [approvalFilter, setApprovalFilter] = useState<
    "all" | "approved" | "pending"
  >("all");
  const [sortField, setSortField] = useState<"createdAt" | "companyName">(
    "createdAt",
  );
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Dialog state
  const [selectedViewProvider, setSelectedViewProvider] =
    useState<ServiceProvider | null>(null);
  const [selectedEditProvider, setSelectedEditProvider] =
    useState<ServiceProvider | null>(null);
  const [selectedDeleteProvider, setSelectedDeleteProvider] =
    useState<ServiceProvider | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isActiveParam =
    statusFilter === "active"
      ? true
      : statusFilter === "inactive"
        ? false
        : undefined;
  const isApprovedParam =
    approvalFilter === "approved"
      ? true
      : approvalFilter === "pending"
        ? false
        : undefined;
  const sortParam = sortOrder === "desc" ? `-${sortField}` : sortField;

  const queryKey = [
    "admin-sp-list",
    page,
    search,
    statusFilter,
    approvalFilter,
    sortField,
    sortOrder,
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchServiceProviders({
        page,
        limit: 10,
        search: search || undefined,
        ...(isActiveParam !== undefined ? { isActive: isActiveParam } : {}),
        ...(isApprovedParam !== undefined
          ? { isApproved: isApprovedParam }
          : {}),
        sort: sortParam,
      }),
    staleTime: 20_000,
    retry: 1,
  });

  const providers = data?.data ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (filter: "all" | "active" | "inactive") => {
    setStatusFilter(filter);
    setPage(1);
  };

  const handleApprovalFilterChange = (
    filter: "all" | "approved" | "pending",
  ) => {
    setApprovalFilter(filter);
    setPage(1);
  };

  const toggleSort = (field: "createdAt" | "companyName") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const openEditModal = (provider: ServiceProvider) => {
    setSelectedEditProvider(provider);
    setEditName(String(provider.companyName || ""));
    setEditEmail(String(provider.email || ""));
    setEditPhone(String(provider.phone || ""));
    setEditAddress(String(provider.address || ""));
  };

  const handleUpdateSubmit = async () => {
    if (!selectedEditProvider) return;
    setIsUpdating(true);
    try {
      await updateServiceProvider(selectedEditProvider._id, {
        companyName: editName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
      });
      toast.success("Service provider updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-sp-list"] });
      setSelectedEditProvider(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update service provider");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedDeleteProvider) return;
    setIsDeleting(true);
    try {
      await deleteServiceProvider(selectedDeleteProvider._id);
      toast.success("Service provider deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-sp-list"] });
      setSelectedDeleteProvider(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete service provider");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleApproval = async (provider: ServiceProvider) => {
    const next = !provider.isApproved;
    try {
      await updateServiceProviderStatus(provider._id, { isApproved: next });
      toast.success(
        `Provider has been ${next ? "approved" : "unapproved"}`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-sp-list"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update approval status");
    }
  };

  const handleToggleActive = async (provider: ServiceProvider) => {
    const next = !provider.isActive;
    try {
      await updateServiceProviderStatus(provider._id, { isActive: next });
      toast.success(
        `Provider has been ${next ? "activated" : "deactivated"}`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-sp-list"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update active status");
    }
  };

  return (
    <AppShell
      title="Service Providers Console"
      subtitle="Complete management for all service providers registered on the Versal Axis platform."
    >
      {/* Search and Filters */}
      <Card className="p-4 mb-6 shadow-xs border border-border">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by company name, email, or phone..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-secondary/50 border border-border/80 focus:border-primary focus:bg-card outline-none text-sm placeholder:text-muted-foreground transition-all"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">
                Status:
              </span>
              {(["all", "active", "inactive"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => handleStatusFilterChange(filter)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === filter
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Approval Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">
              Approval:
            </span>
            {(["all", "approved", "pending"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => handleApprovalFilterChange(filter)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  approvalFilter === filter
                    ? filter === "approved"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : filter === "pending"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card className="rounded-xl border border-border overflow-hidden shadow-sm bg-card">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/80 backdrop-blur-md border-b border-border">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-[68px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Profile
                </TableHead>
                <TableHead className="min-w-[200px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  <button
                    onClick={() => toggleSort("companyName")}
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none"
                  >
                    <span>Provider Name</span>
                    {sortField === "companyName" ? (
                      sortOrder === "desc" ? (
                        <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUp className="w-3.5 h-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="min-w-[170px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Category
                </TableHead>
                <TableHead className="min-w-[185px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Email
                </TableHead>
                <TableHead className="min-w-[140px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Phone
                </TableHead>
                <TableHead className="w-[120px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Approval
                </TableHead>
                <TableHead className="w-[110px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Status
                </TableHead>
                <TableHead className="w-[155px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  <button
                    onClick={() => toggleSort("createdAt")}
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none"
                  >
                    <span>Joined</span>
                    {sortField === "createdAt" ? (
                      sortOrder === "desc" ? (
                        <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUp className="w-3.5 h-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[130px] text-right font-semibold text-xs text-foreground uppercase tracking-wider py-3.5 pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-border/60">
                    <TableCell className="py-4 pl-4">
                      <Skeleton className="h-9 w-9 rounded-full" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-5 w-18 rounded-md" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </TableCell>
                    <TableCell className="py-4">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <Skeleton className="h-8 w-24 ml-auto rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-64 text-center py-10"
                  >
                    <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        Failed to load service providers
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        There was an error communicating with the backend.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        className="gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : providers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="h-64 text-center py-10"
                  >
                    <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-secondary grid place-items-center mb-3">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        No service providers found
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your search or filter options.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((provider) => {
                  const companyName = String(
                    provider.companyName || provider.name || "—",
                  );
                  const initials = companyName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  const categories = Array.isArray(provider.serviceCategories)
                    ? (provider.serviceCategories as string[])
                    : [];

                  return (
                    <TableRow
                      key={provider._id}
                      className="hover:bg-muted/40 transition-colors border-border/60"
                    >
                      {/* Profile */}
                      <TableCell className="py-3.5 pl-4">
                        <Avatar className="h-9 w-9 border border-border shadow-xs">
                          <AvatarImage
                            src={String(provider.profileImage || "")}
                            alt={companyName}
                          />
                          <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-semibold">
                            {initials || "SP"}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      {/* Provider Name */}
                      <TableCell className="font-semibold text-sm text-foreground py-3.5">
                        {companyName}
                      </TableCell>

                      {/* Category (service categories) */}
                      <TableCell className="py-3.5">
                        {categories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {categories.slice(0, 2).map((cat) => (
                              <Badge
                                key={cat}
                                className="bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-none text-[10px] px-1.5 py-0"
                              >
                                {cat}
                              </Badge>
                            ))}
                            {categories.length > 2 && (
                              <Badge className="bg-secondary text-muted-foreground border border-border shadow-none text-[10px] px-1.5 py-0">
                                +{categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-sm text-foreground/90 py-3.5">
                        {String(provider.email || "—")}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-sm text-foreground/90 py-3.5">
                        {String(provider.phone || "—")}
                      </TableCell>

                      {/* Approval */}
                      <TableCell className="py-3.5">
                        <button
                          onClick={() => handleToggleApproval(provider)}
                          title="Click to toggle approval"
                          className="focus:outline-none cursor-pointer"
                        >
                          {provider.isApproved ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-500/25 shadow-none gap-1 py-0.5">
                              <ShieldCheck className="w-3 h-3" /> Approved
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/15 text-amber-700 border border-amber-200/50 hover:bg-amber-500/25 shadow-none gap-1 py-0.5">
                              <ShieldX className="w-3 h-3" /> Pending
                            </Badge>
                          )}
                        </button>
                      </TableCell>

                      {/* Active Status */}
                      <TableCell className="py-3.5">
                        <button
                          onClick={() => handleToggleActive(provider)}
                          title="Click to toggle status"
                          className="focus:outline-none cursor-pointer"
                        >
                          {provider.isActive ? (
                            <Badge className="bg-sky-500/15 text-sky-700 border border-sky-200/50 hover:bg-sky-500/25 shadow-none gap-1 py-0.5">
                              <UserCheck className="w-3 h-3" /> Active
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-500/15 text-slate-700 border border-slate-200 hover:bg-slate-500/25 shadow-none gap-1 py-0.5">
                              <UserX className="w-3 h-3" /> Inactive
                            </Badge>
                          )}
                        </button>
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell className="text-xs text-muted-foreground py-3.5">
                        {formatRegDate(provider.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => setSelectedViewProvider(provider)}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => openEditModal(provider)}
                            title="Edit Provider"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => setSelectedDeleteProvider(provider)}
                            title="Delete Provider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">
              {providers.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">{totalCount}</span>{" "}
            service providers
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs mr-1">
                Page{" "}
                <span className="font-medium text-foreground">{page}</span> of{" "}
                {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage(1)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage(totalPages)}
                  className="h-8 w-8 p-0"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* VIEW MODAL */}
      <Dialog
        open={!!selectedViewProvider}
        onOpenChange={() => setSelectedViewProvider(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Service Provider Profile</DialogTitle>
            <DialogDescription>
              Full details for this registered service provider.
            </DialogDescription>
          </DialogHeader>
          {selectedViewProvider && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Avatar className="h-12 w-12 border border-border shadow-xs">
                  <AvatarFallback className="bg-indigo-50 text-indigo-600 text-sm font-semibold">
                    {String(
                      selectedViewProvider.companyName ||
                        selectedViewProvider.name ||
                        "SP",
                    )
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-foreground">
                    {String(
                      selectedViewProvider.companyName ||
                        selectedViewProvider.name ||
                        "—",
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    ID: {selectedViewProvider._id}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 items-end">
                  {selectedViewProvider.isApproved ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-200/50 shadow-none gap-1">
                      <ShieldCheck className="w-3 h-3" /> Approved
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/15 text-amber-700 border border-amber-200/50 shadow-none gap-1">
                      <ShieldX className="w-3 h-3" /> Pending
                    </Badge>
                  )}
                  {selectedViewProvider.isActive ? (
                    <Badge className="bg-sky-500/15 text-sky-700 border border-sky-200/50 shadow-none gap-1">
                      <UserCheck className="w-3 h-3" /> Active
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-500/15 text-slate-700 border border-slate-200 shadow-none gap-1">
                      <UserX className="w-3 h-3" /> Inactive
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">
                      Email Address
                    </span>
                    <span className="font-medium text-foreground">
                      {String(selectedViewProvider.email || "—")}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">
                      Phone Number
                    </span>
                    <span className="font-medium text-foreground">
                      {String(selectedViewProvider.phone || "—")}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">
                      Address
                    </span>
                    <span className="font-medium text-foreground leading-relaxed">
                      {String(selectedViewProvider.address || "—")}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">
                      Service Categories
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Array.isArray(selectedViewProvider.serviceCategories) &&
                      (selectedViewProvider.serviceCategories as string[])
                        .length > 0 ? (
                        (
                          selectedViewProvider.serviceCategories as string[]
                        ).map((cat) => (
                          <Badge
                            key={cat}
                            className="bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-none text-xs"
                          >
                            {cat}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <CalendarDays className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">
                      Joined Platform
                    </span>
                    <span className="font-medium text-foreground">
                      {formatRegDate(selectedViewProvider.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedViewProvider(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog
        open={!!selectedEditProvider}
        onOpenChange={() => setSelectedEditProvider(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service Provider</DialogTitle>
            <DialogDescription>
              Update the details for this service provider profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sp-companyName">Company Name</Label>
              <Input
                id="sp-companyName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-email">Email Address</Label>
              <Input
                id="sp-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-phone">Phone Number</Label>
              <Input
                id="sp-phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-address">Address</Label>
              <Input
                id="sp-address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedEditProvider(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog
        open={!!selectedDeleteProvider}
        onOpenChange={() => setSelectedDeleteProvider(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-1.5">
              <Trash2 className="w-5 h-5" /> Delete Service Provider
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this service provider?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedDeleteProvider && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                Deleting{" "}
                <span className="font-bold">
                  {String(
                    selectedDeleteProvider.companyName ||
                      selectedDeleteProvider.name,
                  )}
                </span>{" "}
                will remove their account and all associated service listings
                from the platform.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDeleteProvider(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteSubmit}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
