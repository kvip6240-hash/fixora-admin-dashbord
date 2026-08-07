import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, SectionHeader } from "@/components/app-shell";

const revenueData = [
  { day: "Mon", revenue: 4200, bookings: 32 },
  { day: "Tue", revenue: 5800, bookings: 45 },
  { day: "Wed", revenue: 7100, bookings: 58 },
  { day: "Thu", revenue: 6400, bookings: 50 },
  { day: "Fri", revenue: 8900, bookings: 72 },
  { day: "Sat", revenue: 9500, bookings: 81 },
  { day: "Sun", revenue: 7800, bookings: 64 },
];

const popularServicesData = [
  { name: "Plumbing", count: 420, color: "#2563EB" },
  { name: "Electrical", count: 350, color: "#10B981" },
  { name: "Cleaning", count: 290, color: "#F59E0B" },
  { name: "HVAC Repair", count: 210, color: "#8B5CF6" },
  { name: "Carpentry", count: 160, color: "#EC4899" },
];

export function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 min-[1100px]:grid-cols-3 gap-6">
      {/* Revenue Chart */}
      <Card className="p-5 border-border/80 bg-white min-[1100px]:col-span-2">
        <SectionHeader title="Revenue & Performance" hint="Weekly financial trajectory" />
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 12 }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1E293B",
                  borderRadius: "8px",
                  color: "#FFF",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Popular Services Chart */}
      <Card className="p-5 border-border/80 bg-white">
        <SectionHeader title="Popular Services" hint="Top requested categories" />
        <div className="h-56 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={popularServicesData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
              >
                {popularServicesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 space-y-2">
          {popularServicesData.map((s) => (
            <div key={s.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-medium text-slate-700">{s.name}</span>
              </div>
              <span className="font-semibold text-slate-900">{s.count} jobs</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
