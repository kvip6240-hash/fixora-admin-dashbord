import { Star } from "lucide-react";
import { Card, SectionHeader } from "@/components/app-shell";

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: "booking" | "user" | "payout" | "system";
}

export interface NewUserItem {
  id: string;
  name: string;
  role: "Customer" | "Provider";
  joined: string;
}

export interface ReviewItem {
  id: string;
  user: string;
  provider: string;
  rating: number;
  comment: string;
  time: string;
}

export function ActivityPanel({
  latestReviews,
}: {
  activities: ActivityItem[];
  newUsers: NewUserItem[];
  latestReviews: ReviewItem[];
  todayRevenue: string;
}) {
  return (
    <div className="space-y-6">
      {/* Latest Reviews */}
      <Card className="p-5 border-border/80 bg-white">
        <SectionHeader title="Latest Reviews" hint="Customer feedback" />
        <div className="space-y-4 mt-3">
          {latestReviews.map((rev) => (
            <div key={rev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{rev.user}</span>
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-bold text-slate-700">{rev.rating}</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 italic line-clamp-2">"{rev.comment}"</p>
              <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                <span>For: {rev.provider}</span>
                <span>{rev.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
