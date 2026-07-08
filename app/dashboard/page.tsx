"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
type Plan = "starter" | "growth" | null;

interface Profile {
  id: string;
  business_name: string | null;
  plan: Plan;
  trial_ends_at: string | null;
}

interface Lead {
  id: string;
  name: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
  value: number | null;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new: { bg: "rgba(59,130,246,0.15)", text: "#93c5fd" },
  contacted: { bg: "rgba(234,179,8,0.15)", text: "#fde047" },
  booked: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  lost: { bg: "rgba(239,68,68,0.15)", text: "#fca5a5" },
};

const ALL_TOOLS = [
  { id: "ai-inbox", name: "AI Lead Inbox", desc: "See every conversation your AI has had with a lead.", minPlan: "starter" },
  { id: "calendar", name: "Booking Calendar", desc: "View and manage upcoming appointments.", minPlan: "starter" },
  { id: "followups", name: "Follow-up Sequences", desc: "Automated messages sent to leads who haven't booked.", minPlan: "starter" },
  { id: "multi-location", name: "Multi-Location Routing", desc: "Route leads to the right location automatically.", minPlan: "growth" },
  { id: "reporting", name: "Advanced Reporting", desc: "Deep-dive into ROI, lead sources, and close rates.", minPlan: "growth" },
  { id: "branding", name: "Custom Branding", desc: "White-label your booking page and messages.", minPlan: "growth" },
];

const TOOL_ROUTES: Record<string, string> = {
     "ai-inbox": "/dashboard/leads",
     "calendar": "/dashboard/calendar",
     "followups": "/dashboard/followups",
     "multi-location": "/dashboard/multi-location",
     "reporting": "/dashboard/roi",
     "branding": "/dashboard/branding",
   };
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay();
  const diff = (day === 0 ? 6 : day - 1);
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState({
    leadsToday: 0,
    bookedThisWeek: 0,
    revenueThisMonth: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id, business_name, plan, trial_ends_at")
        .eq("id", user.id)
        .single();

      if (profileError || !profileRow) {
        router.push("/login");
        return;
      }

      const trialEnded =
        profileRow.trial_ends_at !== null &&
        new Date(profileRow.trial_ends_at).getTime() < Date.now();

      if (!profileRow.plan && trialEnded) {
        router.push("/pricing");
        return;
      }

      if (cancelled) return;
      setProfile(profileRow as Profile);

      const { data: leadRows } = await supabase
        .from("leads")
        .select("id, name, source, status, created_at, value")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const allLeads = (leadRows ?? []) as Lead[];

      const today = startOfToday();
      const week = startOfWeek();
      const month = startOfMonth();

      const leadsToday = allLeads.filter(
        (l) => new Date(l.created_at) >= today
      ).length;

      const bookedThisWeek = allLeads.filter(
        (l) => l.status === "booked" && new Date(l.created_at) >= week
      ).length;

      const revenueThisMonth = allLeads
        .filter(
          (l) =>
            l.status === "booked" &&
            new Date(l.created_at) >= month &&
            typeof l.value === "number"
        )
        .reduce((sum, l) => sum + (l.value ?? 0), 0);

      const bookedTotal = allLeads.filter((l) => l.status === "booked").length;
      const conversionRate =
        allLeads.length > 0 ? Math.round((bookedTotal / allLeads.length) * 100) : 0;

      if (cancelled) return;
      setLeads(allLeads.slice(0, 5));
      setStats({ leadsToday, bookedThisWeek, revenueThisMonth, conversionRate });
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
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
          Loading dashboard…
        </p>
      </main>
    );
  }

  const plan = profile?.plan ?? null;
  const availableTools = ALL_TOOLS.filter((t) => {
    if (t.minPlan === "starter") return true;
    return plan === "growth";
  });

  const statCards = [
    { label: "Leads Today", value: stats.leadsToday.toString() },
    { label: "Appointments Booked This Week", value: stats.bookedThisWeek.toString() },
    {
      label: "Revenue This Month",
      value: `$${stats.revenueThisMonth.toLocaleString()}`,
    },
    { label: "Conversion Rate", value: `${stats.conversionRate}%` },
  ];

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
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "36px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0 }}>
              {profile?.business_name || "Your Business"}
            </h1>
            <p style={{ color: "rgba(240,253,244,0.5)", fontSize: "14px", marginTop: "4px" }}>
              Welcome back
            </p>
          </div>
          <span
            style={{
              padding: "8px 16px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 700,
              background: plan ? "rgba(34,197,94,0.15)" : "rgba(240,253,244,0.08)",
              color: plan ? "#4ade80" : "rgba(240,253,244,0.5)",
              border: `1px solid ${plan ? "rgba(34,197,94,0.3)" : "rgba(240,253,244,0.15)"}`,
            }}
          >
            {plan ? `${PLAN_LABELS[plan]} Plan` : "No active plan"}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                background: "rgba(240,253,244,0.03)",
                border: "1px solid rgba(74,222,128,0.15)",
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#4ade80" }}>
                {card.value}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(240,253,244,0.55)", marginTop: "6px" }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>
            Recent Leads
          </h2>
          <div
            style={{
              background: "rgba(240,253,244,0.03)",
              border: "1px solid rgba(74,222,128,0.15)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {leads.length === 0 ? (
              <p style={{ padding: "24px", color: "rgba(240,253,244,0.4)", fontSize: "14px" }}>
                No leads yet. Once your AI starts capturing leads, they will show up here.
              </p>
            ) : (
              leads.map((lead, i) => {
                const statusStyle = STATUS_COLORS[lead.status ?? "new"] ?? STATUS_COLORS.new;
                return (
                  <div
                    key={lead.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      borderBottom:
                        i < leads.length - 1 ? "1px solid rgba(74,222,128,0.08)" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>
                        {lead.name || "Unknown lead"}
                      </div>
                      <div style={{ fontSize: "12px", color: "rgba(240,253,244,0.4)", marginTop: "2px" }}>
                        {lead.source || "Unknown source"} - {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        textTransform: "capitalize",
                      }}
                    >
                      {lead.status || "new"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>
            Your Tools
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {availableTools.map((tool) => {
     const href = TOOL_ROUTES[tool.id];
     return (
       <Link
         key={tool.id}
         href={href}
         style={{
           background: "rgba(240,253,244,0.03)",
           border: "1px solid rgba(74,222,128,0.15)",
           borderRadius: "16px",
           padding: "20px",
           display: "block",
           textDecoration: "none",
           color: "inherit",
           cursor: "pointer",
         }}
       >
         <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>
           {tool.name}
         </div>
         <div style={{ fontSize: "13px", color: "rgba(240,253,244,0.5)" }}>
           {tool.desc}
         </div>
       </Link>
     );
   })}
          </div>
        </div>
      </div>
    </main>
  );
}
"use client";
