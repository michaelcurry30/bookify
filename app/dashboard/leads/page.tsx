"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
  value: number | null;
}

interface ConversationMsg {
  id: string;
  role: string | null;
  message: string | null;
}

const SOURCE_ICONS: Record<string, string> = {
  website: "W",
  facebook: "F",
  instagram: "I",
  google: "G",
  "missed-call": "C",
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  new: { bg: "rgba(59,130,246,0.15)", text: "#93c5fd" },
  contacted: { bg: "rgba(234,179,8,0.15)", text: "#fde047" },
  booked: { bg: "rgba(34,197,94,0.15)", text: "#4ade80" },
  lost: { bg: "rgba(239,68,68,0.15)", text: "#fca5a5" },
};

const STATUS_FILTERS = ["all", "new", "contacted", "booked", "lost"];

export default function LeadsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [conversation, setConversation] = useState<ConversationMsg[]>([]);
  const [showBookedModal, setShowBookedModal] = useState(false);
const [jobValue, setJobValue] = useState("");
const [appointmentTime, setAppointmentTime] = useState("");
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setLeads((data ?? []) as Lead[]);
      setLoading(false);
    }
    load();
  }, [router]);

  async function openLead(lead: Lead) {
    setSelectedLead(lead);
    setActionMsg(null);
    const { data } = await supabase
      .from("conversations")
      .select("id, role, message")
      .eq("lead_id", lead.id);
    setConversation((data ?? []) as ConversationMsg[]);
  }

  async function refreshLeads() {
    if (!userId) return;
    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setLeads((data ?? []) as Lead[]);
  }

  async function markAsLost() {
    if (!selectedLead) return;
    const { error } = await supabase
      .from("leads")
      .update({ status: "lost" })
      .eq("id", selectedLead.id);
    if (!error) {
      setActionMsg("Marked as lost.");
      setSelectedLead({ ...selectedLead, status: "lost" });
      refreshLeads();
    }
  }

  async function confirmBooked() {
  if (!selectedLead) return;
  const value = parseFloat(jobValue);
  if (isNaN(value) || value < 0) {
    setActionMsg("Enter a valid job value.");
    return;
  }
  if (!appointmentTime) {
    setActionMsg("Select an appointment date and time.");
    return;
  }
  const { error } = await supabase
    .from("leads")
    .update({ status: "booked", value, appointment_time: appointmentTime })
    .eq("id", selectedLead.id);
  if (!error) {
    setActionMsg("Marked as booked ($" + value.toLocaleString() + ").");
    setSelectedLead({ ...selectedLead, status: "booked", value });
    setShowBookedModal(false);
    setJobValue("");
    setAppointmentTime("");
    refreshLeads();

    try {
      await fetch("/api/send-calendar-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: selectedLead.id, appointmentTime }),
      });
    } catch (inviteErr) {
      console.error("Failed to send calendar invite:", inviteErr);
    }
  }
}

  async function sendFollowUp() {
    if (!selectedLead || !userId) return;
    const followUpMsg = "Hi " + (selectedLead.name || "there") + ", just following up on your message - are you still looking to get this taken care of? Happy to answer any questions or get you booked in.";
    const { error } = await supabase.from("conversations").insert({
      lead_id: selectedLead.id,
      user_id: userId,
      role: "assistant",
      message: followUpMsg,
    });
    if (!error) {
      setActionMsg("Follow-up sent.");
      setConversation((prev) => [
        ...prev,
        { id: "temp-" + Date.now(), role: "assistant", message: followUpMsg },
      ]);
      if (selectedLead.status === "new") {
        await supabase
          .from("leads")
          .update({ status: "contacted" })
          .eq("id", selectedLead.id);
        setSelectedLead({ ...selectedLead, status: "contacted" });
        refreshLeads();
      }
    }
  }

  const filteredLeads =
    statusFilter === "all"
      ? leads
      : leads.filter((l) => (l.status ?? "new") === statusFilter);

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
          Loading leads...
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#052e16",
        fontFamily: "Inter,system-ui,sans-serif",
        color: "#f0fdf4",
        padding: "40px 24px",
        display: "flex",
        gap: "24px",
      }}
    >
      <div style={{ flex: 1, maxWidth: selectedLead ? "calc(100% - 420px)" : "1100px", margin: selectedLead ? "0" : "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "20px" }}>Leads</h1>

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "capitalize",
                cursor: "pointer",
                border: "1px solid",
                borderColor: statusFilter === f ? "#4ade80" : "rgba(240,253,244,0.15)",
                background: statusFilter === f ? "rgba(34,197,94,0.15)" : "transparent",
                color: statusFilter === f ? "#4ade80" : "rgba(240,253,244,0.6)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div
          style={{
            background: "rgba(240,253,244,0.03)",
            border: "1px solid rgba(74,222,128,0.15)",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {filteredLeads.length === 0 ? (
            <p style={{ padding: "24px", color: "rgba(240,253,244,0.4)", fontSize: "14px" }}>
              No leads match this filter.
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(74,222,128,0.15)" }}>
                  {["Name", "Source", "Message", "Status", "Date"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "14px 16px",
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
                {filteredLeads.map((lead) => {
                  const statusStyle = STATUS_STYLES[lead.status ?? "new"] ?? STATUS_STYLES.new;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => openLead(lead)}
                      style={{
                        borderBottom: "1px solid rgba(74,222,128,0.08)",
                        cursor: "pointer",
                        background:
                          selectedLead?.id === lead.id ? "rgba(74,222,128,0.06)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "14px 16px", fontSize: "14px", fontWeight: 600 }}>
                        {lead.name || "Unknown"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "14px" }}>
                        [{SOURCE_ICONS[lead.source ?? ""] ?? "-"}] {lead.source || "unknown"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: "13px",
                          color: "rgba(240,253,244,0.55)",
                          maxWidth: "260px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {lead.message || "-"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
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
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "13px", color: "rgba(240,253,244,0.4)" }}>
                        {new Date(lead.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedLead && (
        <div
          style={{
            width: "380px",
            flexShrink: 0,
            background: "rgba(240,253,244,0.03)",
            border: "1px solid rgba(74,222,128,0.15)",
            borderRadius: "16px",
            padding: "24px",
            height: "fit-content",
            position: "sticky",
            top: "40px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                {selectedLead.name || "Unknown"}
              </h2>
              <p style={{ fontSize: "12px", color: "rgba(240,253,244,0.4)", marginTop: "4px" }}>
                {selectedLead.email || "No email"} - {selectedLead.phone || "No phone"}
              </p>
            </div>
            <button
              onClick={() => setSelectedLead(null)}
              style={{ background: "none", border: "none", color: "rgba(240,253,244,0.4)", cursor: "pointer", fontSize: "18px" }}
            >
              X
            </button>
          </div>

          {actionMsg && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                color: "#4ade80",
                fontSize: "13px",
              }}
            >
              {actionMsg}
            </div>
          )}

          <div style={{ marginTop: "20px" }}>
            <h3 style={{ fontSize: "12px", textTransform: "uppercase", color: "rgba(240,253,244,0.4)", marginBottom: "10px" }}>
              Conversation
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {selectedLead.message && (
                <div
                  style={{
                    background: "rgba(240,253,244,0.05)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "rgba(240,253,244,0.4)", marginBottom: "4px" }}>
                    LEAD
                  </div>
                  {selectedLead.message}
                </div>
              )}
              {conversation.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    background: "rgba(34,197,94,0.08)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ fontSize: "10px", color: "#4ade80", marginBottom: "4px" }}>
                    YOUR AI
                  </div>
                  {msg.message}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              onClick={() => setShowBookedModal(true)}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                background: "#22c55e",
                color: "#04140a",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Mark as Booked
            </button>
            <button
              onClick={markAsLost}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.1)",
                color: "#fca5a5",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Mark as Lost
            </button>
            <button
              onClick={sendFollowUp}
              style={{
                padding: "10px",
                borderRadius: "10px",
                border: "1px solid rgba(240,253,244,0.15)",
                background: "transparent",
                color: "#f0fdf4",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Send Follow-up
            </button>
          </div>
        </div>
      )}

      {showBookedModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "#0a1f14",
              border: "1px solid rgba(74,222,128,0.2)",
              borderRadius: "16px",
              padding: "28px",
              width: "320px",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>
              Mark as Booked
            </h3>
            <p style={{ fontSize: "13px", color: "rgba(240,253,244,0.5)", marginBottom: "16px" }}>
              What is the job value for this booking?
            </p>
 <input
  type="number"
  autoFocus
  placeholder="e.g. 1500"
  value={jobValue}
  onChange={(e) => setJobValue(e.target.value)}
  style={{
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1.5px solid rgba(74,222,128,0.2)",
    background: "rgba(240,253,244,0.05)",
    color: "#f0fdf4",
    fontSize: "14px",
    marginBottom: "16px",
    boxSizing: "border-box",
  }}
/>
<div style={{ fontSize: "13px", color: "rgba(240,253,244,0.5)", marginBottom: "6px" }}>
  Appointment date & time
</div>
<input
  type="datetime-local"
  value={appointmentTime}
  onChange={(e) => setAppointmentTime(e.target.value)}
  style={{
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1.5px solid rgba(74,222,128,0.2)",
    background: "rgba(240,253,244,0.05)",
    color: "#f0fdf4",
    fontSize: "14px",
    marginBottom: "16px",
    boxSizing: "border-box",
    colorScheme: "dark",
  }}
/>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowBookedModal(false)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "1px solid rgba(240,253,244,0.15)",
                  background: "transparent",
                  color: "rgba(240,253,244,0.6)",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmBooked}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#22c55e",
                  color: "#04140a",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
