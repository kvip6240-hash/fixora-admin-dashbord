import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card, Pill, Button, SectionHeader } from "@/components/app-shell";
import { Building2, Loader2, Search } from "lucide-react";
import { useCompaniesController } from "../hooks/useCompaniesController";
import { SkeletonRow } from "@/components/skeletons";

export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Companies — Fixora Admin" },
      { name: "description", content: "Manage companies registered on the Fixora platform." },
      { property: "og:title", content: "Companies — Fixora Admin" },
      {
        property: "og:description",
        content: "Manage companies registered on the Fixora platform.",
      },
    ],
  }),
  component: Companies,
});

function Companies() {
  const {
    companies,
    total,
    page,
    totalPages,
    isLoading,
    togglingId,
    handleSearch,
    handleFilterChange,
    activeFilter,
    setPage,
    toggleStatus,
  } = useCompaniesController();

  return (
    <AppShell title="Companies" subtitle="Manage all companies registered on the platform.">
      {/* Summary stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Companies", value: total, hint: "Registered on platform" },
          {
            label: "Active Companies",
            value: companies.filter((c) => c.isActive).length,
            hint: "Currently active",
          },
          {
            label: "Inactive Companies",
            value: companies.filter((c) => !c.isActive).length,
            hint: "Deactivated",
          },
        ].map((k) => (
          <Card key={k.label} className="p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-accent/40 text-accent-foreground grid place-items-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-semibold tabular-nums">{k.value}</div>
              <div className="text-xs text-muted-foreground">
                {k.label} · {k.hint}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        {/* Toolbar */}
        <div className="p-5 pb-3 flex flex-wrap items-center gap-3">
          <SectionHeader title="All Companies" hint="Search, filter and manage company status" />
          {/* Search */}
          <div className="ml-auto relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search by name…"
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-secondary/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm"
            />
          </div>
          {/* Filter tabs */}
          <div className="flex items-center gap-1">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeFilter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 border-y border-border text-[11px] uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Company</th>
                <th className="px-3 py-2.5 text-left font-medium">Email</th>
                <th className="px-3 py-2.5 text-left font-medium">Phone</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No companies found.
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c._id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                          {String(c.name ?? "?")
                            .split(" ")
                            .map((w: string) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>
                        <span className="font-medium">{String(c.name ?? "—")}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{String(c.email ?? "—")}</td>
                    <td className="px-3 py-3 text-muted-foreground">{String(c.phone ?? "—")}</td>
                    <td className="px-3 py-3">
                      <Pill tone={c.isActive ? "success" : "destructive"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Pill>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant={c.isActive ? "outline" : "primary"}
                        size="sm"
                        disabled={togglingId === c._id}
                        onClick={() => toggleStatus(c)}
                      >
                        {togglingId === c._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : c.isActive ? (
                          "Deactivate"
                        ) : (
                          "Activate"
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {isLoading ? "Loading…" : `Page ${page} of ${totalPages} · ${total} companies`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}
