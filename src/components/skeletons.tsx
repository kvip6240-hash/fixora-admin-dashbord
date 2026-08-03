/**
 * src/components/skeletons.tsx
 * Reusable animated skeleton placeholders shown during API loading states.
 * These mimic the exact layout of KPI cards, table rows, and kanban cards.
 */

function pulse(className: string) {
  return <div className={`animate-pulse rounded-md bg-secondary ${className}`} />;
}

/** Skeleton for a single KPI stat card */
export function SkeletonKpi() {
  return (
    <div className="rounded-xl bg-card border border-border shadow-[var(--shadow-card)] p-4">
      <div className="flex items-start justify-between">
        {pulse("w-9 h-9 rounded-lg")}
        {pulse("w-10 h-4 rounded")}
      </div>
      {pulse("mt-3 h-7 w-16 rounded")}
      {pulse("mt-2 h-3 w-24 rounded")}
      {pulse("mt-1 h-3 w-20 rounded")}
    </div>
  );
}

/** Skeleton for a single table row (N columns) */
export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          {pulse("h-4 w-full max-w-[120px] rounded")}
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for a kanban project card */
export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-card border border-border shadow-[var(--shadow-card)] p-3.5">
      <div className="flex items-center justify-between">
        {pulse("h-3 w-20 rounded")}
        {pulse("h-3 w-14 rounded")}
      </div>
      {pulse("mt-2 h-4 w-full rounded")}
      {pulse("mt-1 h-3 w-3/4 rounded")}
      <div className="mt-3">
        {pulse("h-1.5 w-full rounded-full")}
      </div>
    </div>
  );
}

/** Generic inline skeleton block */
export function SkeletonText({ className = "" }: { className?: string }) {
  return pulse(`h-4 ${className}`);
}
