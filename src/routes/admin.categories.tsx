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
  CalendarDays,
  Layers,
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
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";
import {
  adminFetchCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  type Category,
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

export const Route = createFileRoute("/admin/categories")({
  head: () => ({
    meta: [
      { title: "Manage Categories — Versal Axis Admin" },
      {
        name: "description",
        content: "Enterprise category management console for Versal Axis admin operations.",
      },
    ],
  }),
  component: AdminCategoriesPage,
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

function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortParam, setSortParam] = useState<"newest" | "oldest" | "alpha">("newest");

  // Selected categories for dialogs
  const [selectedViewCategory, setSelectedViewCategory] = useState<Category | null>(null);
  const [selectedEditCategory, setSelectedEditCategory] = useState<Category | null>(null);
  const [selectedDeleteCategory, setSelectedDeleteCategory] = useState<Category | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Edit / Create form state
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [categoryIsActive, setCategoryIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isActiveFilter = statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined;
  const queryKey = ["admin-categories-list", page, search, statusFilter, sortParam];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      adminFetchCategories({
        page,
        limit: 10,
        search: search || undefined,
        isActive: isActiveFilter,
        sort: sortParam,
      }),
    staleTime: 20_000,
    retry: 1,
  });

  const categories = data?.data ?? [];
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

  const handleCreateSubmit = async () => {
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await adminCreateCategory({
        name: categoryName.trim(),
        icon: categoryIcon.trim(),
        isActive: categoryIsActive,
      });
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-count-stat"] });
      setIsCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedEditCategory) return;
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await adminUpdateCategory(selectedEditCategory._id, {
        name: categoryName.trim(),
        icon: categoryIcon.trim(),
        isActive: categoryIsActive,
      });
      toast.success("Category updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-count-stat"] });
      setSelectedEditCategory(null);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedDeleteCategory) return;
    setIsSubmitting(true);
    try {
      await adminDeleteCategory(selectedDeleteCategory._id);
      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-count-stat"] });
      setSelectedDeleteCategory(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    const nextStatus = !cat.isActive;
    try {
      await adminUpdateCategory(cat._id, { isActive: nextStatus });
      toast.success(`Category ${nextStatus ? "enabled" : "disabled"} successfully`);
      queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["categories-count-stat"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status");
    }
  };

  const openEditModal = (cat: Category) => {
    setSelectedEditCategory(cat);
    setCategoryName(cat.name);
    setCategoryIcon(cat.icon || "");
    setCategoryIsActive(cat.isActive);
  };

  const resetForm = () => {
    setCategoryName("");
    setCategoryIcon("");
    setCategoryIsActive(true);
  };

  return (
    <AppShell
      title="Platform Categories Console"
      subtitle="Configure and manage service categories dynamically for Versal Axis RFQs and Providers."
    >
      {/* Search and Filters */}
      <Card className="p-4 mb-6 shadow-xs border border-border">
        <div className="flex flex-col min-[880px]:flex-row items-stretch min-[880px]:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search categories by name..."
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
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground mr-1">Sort:</span>
              <select
                value={sortParam}
                onChange={(e) => setSortParam(e.target.value as any)}
                className="h-9 px-2 rounded-lg bg-secondary/50 border border-border/80 text-xs font-medium focus:border-primary focus:bg-card outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              className="gap-1.5 h-9"
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Add Category
            </Button>
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
                  Image
                </TableHead>
                <TableHead className="min-w-[200px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Category Name
                </TableHead>
                <TableHead className="min-w-[260px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Description
                </TableHead>
                <TableHead className="w-[120px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Status
                </TableHead>
                <TableHead className="w-[180px] font-semibold text-xs text-foreground uppercase tracking-wider py-3.5">
                  Created Date
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
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </TableCell>
                    <TableCell className="py-4"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="py-4"><Skeleton className="h-4 w-60" /></TableCell>
                    <TableCell className="py-4"><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                    <TableCell className="py-4"><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="py-4 text-right pr-6"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center py-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive grid place-items-center mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">Failed to load categories</h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        There was an error communicating with the backend server.
                      </p>
                      <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-64 text-center py-10">
                    <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-secondary grid place-items-center mb-3">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">No categories found</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try modifying your search query or add a new category.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => {
                  const name = String(cat.name || "—");
                  const initials = name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  // Provide a general readable description
                  const description = String(cat.description || `Platform services relating to ${name} tasks.`);

                  return (
                    <TableRow key={cat._id} className="hover:bg-muted/40 transition-colors border-border/60">
                      {/* Image / Icon */}
                      <TableCell className="py-3.5 pl-4">
                        <Avatar className="h-9 w-9 border border-border shadow-xs rounded-md">
                          <AvatarImage src={String(cat.icon || "")} alt={name} />
                          <AvatarFallback className="bg-purple-50 text-purple-600 text-xs font-semibold rounded-md">
                            {initials || "CA"}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>

                      {/* Category Name */}
                      <TableCell className="font-semibold text-sm text-foreground py-3.5">
                        {name}
                      </TableCell>

                      {/* Description */}
                      <TableCell className="text-sm text-foreground/80 py-3.5">
                        <span className="line-clamp-1" title={description}>
                          {description}
                        </span>
                      </TableCell>

                      {/* Status Toggle Button */}
                      <TableCell className="py-3.5">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          title="Click to toggle category status"
                          className="focus:outline-none cursor-pointer"
                        >
                          {cat.isActive ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 hover:bg-emerald-500/25 shadow-none gap-1 py-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-200 hover:bg-slate-500/25 shadow-none gap-1 py-0.5">
                              <XCircle className="w-3 h-3" /> Inactive
                            </Badge>
                          )}
                        </button>
                      </TableCell>

                      {/* Created Date */}
                      <TableCell className="text-xs text-muted-foreground py-3.5">
                        {formatRegDate(cat.createdAt)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => setSelectedViewCategory(cat)}
                            title="View Category"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => openEditModal(cat)}
                            title="Edit Category"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => setSelectedDeleteCategory(cat)}
                            title="Delete Category"
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
            Showing <span className="font-medium text-foreground">{categories.length}</span> of{" "}
            <span className="font-medium text-foreground">{totalCount}</span> service categories
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

      {/* CREATE MODAL */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => setIsCreateOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>Create a new service category for the Versal Axis platform.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Category Name</Label>
              <Input
                id="create-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Plumbing, HVAC Repair"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-icon">Icon / Image URL</Label>
              <Input
                id="create-icon"
                value={categoryIcon}
                onChange={(e) => setCategoryIcon(e.target.value)}
                placeholder="e.g. https://example.com/icons/plumbing.png"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="create-active"
                type="checkbox"
                checked={categoryIsActive}
                onChange={(e) => setCategoryIsActive(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <Label htmlFor="create-active" className="cursor-pointer">Active on platform</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT MODAL */}
      <Dialog open={!!selectedEditCategory} onOpenChange={() => setSelectedEditCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Modify parameters for this service category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-icon">Icon / Image URL</Label>
              <Input
                id="edit-icon"
                value={categoryIcon}
                onChange={(e) => setCategoryIcon(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit-active"
                type="checkbox"
                checked={categoryIsActive}
                onChange={(e) => setCategoryIsActive(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <Label htmlFor="edit-active" className="cursor-pointer">Active on platform</Label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedEditCategory(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpdateSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW MODAL */}
      <Dialog open={!!selectedViewCategory} onOpenChange={() => setSelectedViewCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
            <DialogDescription>Overview profile of this service category.</DialogDescription>
          </DialogHeader>
          {selectedViewCategory && (
            <div className="space-y-4 py-2 text-sm">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <Avatar className="h-12 w-12 border border-border shadow-xs rounded-md">
                  <AvatarImage src={String(selectedViewCategory.icon || "")} alt={selectedViewCategory.name} />
                  <AvatarFallback className="bg-purple-50 text-purple-600 text-sm font-semibold rounded-md">
                    {String(selectedViewCategory.name)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-base text-foreground">{selectedViewCategory.name}</h3>
                  <p className="text-xs text-muted-foreground">ID: {selectedViewCategory._id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Description</span>
                    <span className="font-medium text-foreground leading-relaxed">
                      {String(selectedViewCategory.description || `Platform services relating to ${selectedViewCategory.name} tasks.`)}
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <CalendarDays className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Created On</span>
                    <span className="font-medium text-foreground">{formatRegDate(selectedViewCategory.createdAt)}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50 flex items-start gap-2.5">
                  <RefreshCw className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block">Status</span>
                    <span className="font-medium text-foreground">
                      {selectedViewCategory.isActive ? "Active (Enabled on platform)" : "Inactive (Disabled on platform)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelectedViewCategory(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={!!selectedDeleteCategory} onOpenChange={() => setSelectedDeleteCategory(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-1.5">
              <Trash2 className="w-5 h-5" /> Delete Category
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this category? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          {selectedDeleteCategory && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                Deleting category <span className="font-bold">{selectedDeleteCategory.name}</span> will remove it completely from platform configuration.
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setSelectedDeleteCategory(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
