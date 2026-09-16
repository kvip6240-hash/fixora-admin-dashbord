import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
} from "lucide-react";
import { fetchUsers, updateUser, deleteUser, type User } from "@/lib/api";
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

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Manage Users — Versal Axis Admin" },
      { name: "description", content: "Executive user management console for Versal Axis admin operations." },
    ],
  }),
  component: AdminUsersPage,
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

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortField, setSortField] = useState<"createdAt" | "companyName">("createdAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Selected users for action dialogs
  const [selectedViewUser, setSelectedViewUser] = useState<User | null>(null);
  const [selectedEditUser, setSelectedEditUser] = useState<User | null>(null);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState<User | null>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isActiveParam = statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
  const sortParam = sortOrder === "desc" ? `-${sortField}` : sortField;

  const queryKey = ["admin-users-list", page, search, statusFilter, sortField, sortOrder];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchUsers({
        page,
        limit: 10,
        search: search || undefined,
        ...(isActiveParam !== undefined ? { isActive: isActiveParam } : {}),
        sort: sortParam,
      }),
    staleTime: 20_000,
    retry: 1,
  });

  const usersList = data?.data ?? [];
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

  const toggleSort = (field: "createdAt" | "companyName") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Open Edit Modal
  const openEditModal = (user: User) => {
    setSelectedEditUser(user);
    setEditName(String(user.companyName || user.name || ""));
    setEditEmail(String(user.email || ""));
    setEditPhone(String(user.phone || ""));
    setEditAddress(String(user.address || ""));
  };

  // Handle Edit Submit
  const handleUpdateSubmit = async () => {
    if (!selectedEditUser) return;
    setIsUpdating(true);
    try {
      await updateUser(selectedEditUser._id, {
        companyName: editName,
        email: editEmail,
        phone: editPhone,
        address: editAddress,
      });
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setSelectedEditUser(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!selectedDeleteUser) return;
    setIsDeleting(true);
    try {
      await deleteUser(selectedDeleteUser._id);
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setSelectedDeleteUser(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Quick Status Toggle
  const handleToggleStatus = async (user: User) => {
    const nextStatus = !user.isActive;
    try {
      await updateUser(user._id, { isActive: nextStatus });
      toast.success(`User has been ${nextStatus ? "activated" : "deactivated"}`);
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status");
    }
  };

  return (
    <AppShell
      title="Admin Users Console"
      subtitle="Complete management of all customer companies registered on the Versal Axis platform."
    >
      {/* Search and Filters */}
      <Card className="p-4 mb-6 shadow-xs border border-border">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
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

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-medium text-muted-foreground mr-1 shrink-0">
              Filter:
            </span>
            {(["all", "active", "inactive"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => handleStatusFilterChange(filter)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
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
      </Card>

      {/* Main Table */}
      <Card className="rounded-xl border border-border overflow-hidden shadow-sm bg-card">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/80 backdrop-blur-md border-b border-border">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-[80px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Profile
                </TableHead>
                <TableHead className="min-w-[220px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  <button
                    onClick={() => toggleSort("companyName")}
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none"
                  >
                    <span>Name</span>
                    {sortField === "companyName" ? (
                      sortOrder === "desc" ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="min-w-[200px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Email
                </TableHead>
                <TableHead className="min-w-[150px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Phone
                </TableHead>
                <TableHead className="w-[120px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Status
                </TableHead>
                <TableHead className="w-[180px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  <button
                    onClick={() => toggleSort("createdAt")}
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors focus:outline-none"
                  >
                    <span>Registered On</span>
                    {sortField === "createdAt" ? (
                      sortOrder === "desc" ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[140px] text-right font-semibold text-xs text-foreground uppercase tracking-wider py-3.5 pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-border/60">
                    <TableCell className="py-4 pl-4">
                      <Skeleton className="h-9 w-9 rounded-full" />
                    </TableCell>
                    <TableCell className="py-4"><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell className="py-4"><Skeleton className="h-4 w-44" /></TableCell>
                    <TableCell className="py-4"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="py-4"><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                    <TableCell className="py-4"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="py-4 text-right pr-6"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center py-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Failed to load user list</h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        There was an error communicating with the backend server.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : usersList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center py-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-secondary grid place-items-center mb-3 text-muted-foreground">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">No users found</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try modifying your search query or status filter.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                usersList.map((user) => {
                  const companyName = String(user.companyName || user.name || "—");
                  const userInitials = companyName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <TableRow key={user._id} className="hover:bg-muted/40 transition-colors border-border/60">
                      {/* Profile Image (Avatar) */}
                      <TableCell className="py-3.5 pl-4">
                        <Avatar className="h-9 w-9 border border-border shadow-xs">
                          <AvatarImage src={String(user.profileImage || "")} alt={companyName} />
                          <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold">
                            {userInitials || "CO"}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      {/* Name */}
                      <TableCell className="font-semibold text-sm text-foreground py-3.5">
                        {companyName}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-sm text-foreground/90 py-3.5">
                        {String(user.email || "—")}
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="text-sm text-foreground/90 py-3.5">
                        {String(user.phone || "—")}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3.5">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          title="Click to toggle user status"
                          className="focus:outline-none cursor-pointer"
                        >
                          {user.isActive ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 hover:bg-emerald-500/25 shadow-none gap-1 py-0.5">
                              <UserCheck className="w-3 h-3" /> Active
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-200 hover:bg-slate-500/25 shadow-none gap-1 py-0.5">
                              <UserX className="w-3 h-3" /> Inactive
                            </Badge>
                          )}
                        </button>
                      </TableCell>

                      {/* Registration Date */}
                      <TableCell className="text-xs text-muted-foreground py-3.5">
                        {formatRegDate(user.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => setSelectedViewUser(user)}
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => openEditModal(user)}
                            title="Edit User"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => setSelectedDeleteUser(user)}
                            title="Delete User"
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

        {/* Footer / Pagination */}
        <div className="px-4 py-3 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-medium text-foreground">{usersList.length}</span> of{" "}
            <span className="font-medium text-foreground">{totalCount}</span> registered users
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
      <Dialog open={!!selectedViewUser} onOpenChange={() => setSelectedViewUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>View User Profile</DialogTitle>
            <DialogDescription>Full company details from registration profile.</DialogDescription>
          </DialogHeader>
          {selectedViewUser && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Avatar className="h-12 w-12 border border-border shadow-xs">
                  <AvatarFallback className="bg-primary/5 text-primary text-sm font-semibold">
                    {String(selectedViewUser.companyName || selectedViewUser.name || "CO")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base text-foreground">
                    {String(selectedViewUser.companyName || selectedViewUser.name || "—")}
                  </h3>
                  <p className="text-xs text-muted-foreground">ID: {selectedViewUser._id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Email Address</span>
                    <span className="font-medium text-foreground">{String(selectedViewUser.email || "—")}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Phone Number</span>
                    <span className="font-medium text-foreground">{String(selectedViewUser.phone || "—")}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Office Address</span>
                    <span className="font-medium text-foreground leading-relaxed">{String(selectedViewUser.address || "—")}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <CalendarDays className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Platform Joining Date</span>
                    <span className="font-medium text-foreground">{formatRegDate(selectedViewUser.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedViewUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={!!selectedEditUser} onOpenChange={() => setSelectedEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Modify primary details for this company profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedEditUser(null)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateSubmit} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={!!selectedDeleteUser} onOpenChange={() => setSelectedDeleteUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-1.5">
              <Trash2 className="w-5 h-5" /> Delete User Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this user? This action is irreversible and will remove all profile details.
            </DialogDescription>
          </DialogHeader>
          {selectedDeleteUser && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                Deleting <span className="font-bold">{String(selectedDeleteUser.companyName || selectedDeleteUser.name)}</span> will prevent them from logging in or requesting services.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedDeleteUser(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteSubmit} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
