"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DayCount = { date: string; count: number };

export function AdminOrdersChart({ data }: { data: DayCount[] }) {
  if (data.length === 0) {
    return (
      <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Not enough order data in the last 30 days to chart.</p>
    );
  }

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickFormatter={(v: string) => v.slice(5)}
            stroke="#cbd5e1"
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} stroke="#cbd5e1" width={36} />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: 13,
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Area type="monotone" dataKey="count" name="Orders" stroke="#1d4ed8" fill="url(#fillOrders)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
