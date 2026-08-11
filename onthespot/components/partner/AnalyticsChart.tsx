"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface AnalyticsPoint {
  date: string;
  views: number;
  rsvps: number;
  saves: number;
}

export function AnalyticsChart({ data }: { data: AnalyticsPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-control border border-dashed border-border text-sm text-neutral-500">
        No analytics data for this range yet.
      </div>
    );
  }

  return (
    <div className="h-72 w-full" role="img" aria-label="Line chart of views, RSVPs, and saves over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f8a7f" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0f8a7f" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-700" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="views" name="Views" stroke="#0f8a7f" fill="url(#viewsFill)" strokeWidth={2} />
          <Area type="monotone" dataKey="rsvps" name="RSVPs" stroke="#ec4110" fillOpacity={0} strokeWidth={2} />
          <Area type="monotone" dataKey="saves" name="Saves" stroke="#8a6d00" fillOpacity={0} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
