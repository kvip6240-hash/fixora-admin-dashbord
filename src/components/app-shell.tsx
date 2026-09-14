import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Wallet,
  Building2,
  BarChart3,
  Settings,
  Search,
  ChevronDown,
} from "lucide-react";

const nav: Array<{
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard, exact: true },
    { label: "RFQ Management", to: "/rfq", icon: FileText },
    { label: "Projects", to: "/projects", icon: Briefcase },
    { label: "Payments", to: "/payments", icon: Wallet },
    { label: "Companies", to: "/companies", icon: Building2 },
    { label: "Reports & Analytics", to: "/reports", icon: BarChart3 },
    { label: "Settings", to: "/settings", icon: Settings },
  ];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Get user details from localStorage
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("fixora_user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Failed to parse user details:", e);
      }
    }
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Toaster position="top-right" richColors closeButton />
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-sidebar border-r border-sidebar-border">
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
          {/* Fixora Brand Mark — dark navy F + teal accents */}
          <svg className="w-9 h-9 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Dark navy vertical stem */}
            <rect x="8" y="8" width="20" height="84" rx="4" fill="#0D2240"/>
            {/* Dark navy top horizontal bar */}
            <rect x="8" y="8" width="76" height="20" rx="4" fill="#0D2240"/>
            {/* Dark navy middle horizontal bar stub */}
            <rect x="8" y="40" width="50" height="18" rx="4" fill="#0D2240"/>
            {/* Teal top-right accent (parallelogram shape) */}
            <rect x="52" y="8" width="32" height="20" rx="4" fill="#2DB899"/>
            {/* Teal middle accent */}
            <rect x="36" y="40" width="22" height="18" rx="4" fill="#2DB899"/>
          </svg>

          {/* Vertical Line Divider */}
          <div className="w-[1px] h-7 bg-slate-200 dark:bg-slate-700/60 shrink-0" />

          {/* Branding Text */}
          <div className="flex flex-col justify-center">
            <span className="text-[18px] font-extrabold text-[#0D2240] dark:text-white tracking-[0.4px] leading-none">
              FIXORA
            </span>
            <span className="text-[12px] font-normal text-[#64748B] dark:text-slate-400 tracking-[0.2px] leading-none mt-1">
              Admin Console
            </span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="rounded-lg bg-secondary/60 p-3">
            <div className="text-xs font-medium text-foreground">Operations SLA</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">98.4% within target</div>
            <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
              <div className="h-full bg-primary" style={{ width: "98%" }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top nav */}
        <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search RFQs, quotations, providers…"
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary/60 border border-transparent focus:border-primary focus:bg-card outline-none text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1 rounded-md bg-secondary/60">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> All systems operational
            </span>
            <button className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg hover:bg-secondary/70">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
                {user ? getInitials(user.name) : "AD"}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <div className="text-xs font-medium">{user ? user.name : "Admin User"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {user ? user.role.replace("_", " ") : "Ops Manager · UK"}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("fixora_token");
                localStorage.removeItem("fixora_user");
                window.location.href = "/login";
              }}
              className="hidden sm:inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary/60 text-foreground text-xs font-medium h-8 px-2.5 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page header */}
        <div className="px-8 pt-8 pb-4 flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        <main className="flex-1 px-8 pb-10">{children}</main>
      </div>
    </div>
  );
}

// Shared primitives
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={"rounded-xl bg-card border border-border shadow-[var(--shadow-card)] " + className}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "primary" | "accent" | "warning" | "info" | "destructive" | "muted" | "success";
const toneClass: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/40 text-accent-foreground",
  warning: "bg-[oklch(0.95_0.08_75)] text-[oklch(0.45_0.14_75)]",
  info: "bg-[oklch(0.95_0.04_235)] text-[oklch(0.42_0.13_235)]",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-secondary text-muted-foreground",
  success: "bg-[oklch(0.94_0.08_155)] text-[oklch(0.38_0.12_155)]",
};

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium " +
        toneClass[tone]
      }
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md";
}) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-9 px-3.5 text-sm" };
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-secondary text-foreground",
    outline: "border border-border bg-card hover:bg-secondary/60 text-foreground",
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
