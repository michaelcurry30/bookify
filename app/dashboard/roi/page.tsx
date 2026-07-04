"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BookedLead {
  id: string;
  name: string | null;
  source: string | null;
  value: number | null;
  created_at: string;
}

const PLAN_COST: Record<string, number> = {
  starter: 197,
  growth: 297,
};

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  facebook: "Facebook",
  instagram: "Instagram",
  google: "Google",
  "missed-call": "Missed Call",
};

function monthKey(date: Date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short" });
}

export default function RoiDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [planCost, setPlanCost] = useState(0);
  const [bookedLeads, setBookedLeads] = useState<BookedLead[]>([]);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .single();

      const cost = profile?.plan ? PLAN_COST[profile.plan] ?? 0 : 0;
      setPlanCost(cost);

      const { data: leads } = await supabase
        .from("leads")
        .select("id, name, source, value, created_at")
        .eq("user_id", user.id)
        .eq("status", "booked")
        .order("created_at", { ascending: false });

      setBookedLeads((leads ?? []) as BookedLead[]);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#052e16",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "rgba(240,253,244,0.5)", fontFamily: "Inter,system-ui,sans-serif" }}>
          Loading ROI dashboard...
        </p>
      </main>
    );
  }

  const now = new Date();
  const thisMonthKey = monthKey(now);

  const thisMonthBookings = bookedLeads.filter(
    (l) => monthKey(new Date(l.created_at)) === thisMonthKey
  );

  const revenueThisMonth = thisMonthBookings.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const totalBookedThisMonth = thisMonthBookings.length;
  const costPerBooking =
    totalBookedThisMonth > 0 ? planCost / totalBookedThisMonth : 0;
  const roiMultiplier = planCost > 0 ? revenueThisMonth / planCost : 0;

  const chartData: { month: string; Revenue: number; "Subscription Cost": number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const monthRevenue = bookedLeads
      .filter((l) => monthKey(new Date(l.created_at)) === key)
      .reduce((sum, l) => sum + (l.value ?? 0), 0);
    chartData.push({
      month: monthLabel(d),
      Revenue: monthRevenue,
      "Subscription Cost": planCost,
    });
  }

  const sourceGroups: Record<string, { count: number; revenue: number }> = {};
  thisMonthBookings.forEach((l) => {
    const key = l.source ?? "unknown";
    if (!sourceGroups[key]) sourceGroups[key] = { count: 0, revenue: 0 };
    sourceGroups[key].count += 1;
    sourceGroups[key].revenue += l.value ?? 0;
  });

  const sourceRows = Object.entries(sourceGroups).map(([source, stats]) => ({
    source,
    count: stats.count,
    revenue: stats.revenue,
    costPerBooking: stats.count > 0 ? planCost / totalBookedThisMonth : 0,
  }));

  const recentBookings = bookedLeads.slice(0, 10);

  const cardStyle: React.CSSProperties = {
    background: "rgba(240,253,244,0.03)",
    border: "1px solid rgba(74,222,128,0.15)",
    borderRadius: "16px",
    padding: "20px",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#052e16",
        fontFamily: "Inter,system-ui,sans-serif",
        color: "#f0fdf4",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "6px" }}>
          ROI & Revenue
        </h1>
        <p style={{ fontSize: "14px", color: "rgba(240,253,244,0.5)", marginBottom: "32px" }}>
          See exactly what BookIfy is putting back in your pocket.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div style={cardStyle}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80" }}>
              ${revenueThisMonth.toLocaleString()}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(240,253,244,0.55)", marginTop: "6px" }}>
              Revenue From Bookings This Month
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80" }}>
              ${costPerBooking > 0 ? costPerBooking.toFixed(2) : "0.00"}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(240,253,244,0.55)", marginTop: "6px" }}>
              Cost Per Booked Appointment
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80" }}>
              {roiMultiplier > 0 ? roiMultiplier.toFixed(1) + "x" : "-"}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(240,253,244,0.55)", marginTop: "6px" }}>
              ROI Multiplier
            </div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80" }}>
              {totalBookedThisMonth}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(240,253,244,0.55)", marginTop: "6px" }}>
              Total Appointments Booked This Month
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>
            Revenue vs. Subscription Cost - Last 6 Months
          </h2>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.1)" />
                <XAxis dataKey="month" stroke="rgba(240,253,244,0.5)" fontSize={12} />
                <YAxis stroke="rgba(240,253,244,0.5)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0a1f14",
                    border: "1px solid rgba(74,222,128,0.3)",
                    borderRadius: "8px",
                    color: "#f0fdf4",
                  }}
                />
                <Legend />
                <Bar dataKey="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Subscription Cost" fill="rgba(240,253,244,0.25)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: "40px", padding: 0, overflow: "hidden" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, padding: "20px 20px 0" }}>
            Cost Per Booking by Lead Source
          </h2>
          {sourceRows.length === 0 ? (
            <p style={{ padding: "20px", color: "rgba(240,253,244,0.4)", fontSize: "14px" }}>
              No bookings yet this month.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.15)" }}>
                  {["Source", "Bookings", "Revenue", "Cost Per Booking"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 20px",
                        fontSize: "12px",
                        color: "rgba(240,253,244,0.4)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sourceRows.map((row) => (
                  <tr key={row.source} style={{ borderBottom: "1px solid rgba(74,222,128,0.08)" }}>
                    <td style={{ padding: "12px 20px", fontSize: "14px" }}>
                      {SOURCE_LABELS[row.source] ?? row.source}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: "14px" }}>{row.count}</td>
                    <td style={{ padding: "12px 20px", fontSize: "14px" }}>
                      ${row.revenue.toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: "14px" }}>
                      ${row.costPerBooking.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, padding: "20px 20px 0" }}>
            Most Recent Booked Appointments
          </h2>
          {recentBookings.length === 0 ? (
            <p style={{ padding: "20px", color: "rgba(240,253,244,0.4)", fontSize: "14px" }}>
              No booked appointments yet.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.15)" }}>
                  {["Customer", "Source", "Job Value"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 20px",
                        fontSize: "12px",
                        color: "rgba(240,253,244,0.4)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid rgba(74,222,128,0.08)" }}>
                    <td style={{ padding: "12px 20px", fontSize: "14px" }}>
                      {b.name || "Unknown"}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: "14px" }}>
                      {SOURCE_LABELS[b.source ?? ""] ?? b.source ?? "Unknown"}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: "14px", color: "#4ade80" }}>
                      ${(b.value ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
