import { ElementType } from "react";
import { Card } from "@/components/app-shell";
import { Link } from "@tanstack/react-router";

export interface SummaryCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  to?: string;
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  to,
}: SummaryCardProps) {
  const content = (
    <Card className={`p-4 transition-all duration-200 border-border/80 bg-white ${
      to ? "hover:-translate-y-1 hover:shadow-lg cursor-pointer hover:border-primary/50" : "hover:-translate-y-0.5"
    }`}>
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl grid place-items-center ${iconBg} ${iconColor} transition-transform duration-200 hover:scale-105`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</div>
        <div className="text-xs font-medium text-slate-500 mt-1">{title}</div>
      </div>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
