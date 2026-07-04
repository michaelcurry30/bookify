"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const TONES = ["Friendly", "Professional", "Casual"];

export default function SettingsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [preview, setPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
        .from("profiles")
        .select(
          "business_name, service_type, services_offered, price_range, business_hours, tone, website_url"
        )
        .eq("id", user.id)
        .single();

      if (data) {
        setBusinessName(data.business_name || "");
        setBusinessType(data.service_type || "");
        setServicesOffered(data.services_offered || "");
        setPriceRange(data.price_range || "");
        setBusinessHours(data.business_hours || "");
        setTone(data.tone || "Friendly");
        setWebsiteUrl(data.website_url || "");
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setSaveMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        business_name: businessName,
        service_type: businessType,
        services_offered: servicesOffered,
        price_range: priceRange,
        business_hours: businessHours,
        tone,
        website_url: websiteUrl,
      })
      .eq("id", userId);

    setSaving(false);
    setSaveMsg(error ? "Failed to save. Please try again." : "Settings saved.");
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setPreview(null);
    try {
      const res = await fetch("/api/preview-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          business_type: businessType,
          services_offered: servicesOffered,
          price_range: priceRange,
          business_hours: businessHours,
          tone,
          website_url: websiteUrl,
        }),
      });
      const data = await res.json();
      setPreview(data.preview || data.error || "Could not generate preview.");
    } catch {
      setPreview("Could not generate preview.");
    }
    setPreviewLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1.5px solid rgba(74,222,128,0.2)",
    background: "rgba(240,253,244,0.05)",
    color: "#f0fdf4",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "rgba(240,253,244,0.6)",
    marginBottom: "6px",
  };

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
          Loading settings...
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
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>
            Business Settings
          </h1>

          {saveMsg && (
            <div
              style={{
                marginBottom: "16px",
                padding: "10px 14px",
                borderRadius: "10px",
                background: saveMsg.includes("Failed")
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(34,197,94,0.1)",
                border: (saveMsg.includes("Failed") ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)"),
                color: saveMsg.includes("Failed") ? "#fca5a5" : "#4ade80",
                fontSize: "13px",
              }}
            >
              {saveMsg}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={labelStyle}>Business Name</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Business Type</label>
              <input
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="e.g. Water Damage Restoration"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Services Offered</label>
              <textarea
                value={servicesOffered}
                onChange={(e) => setServicesOffered(e.target.value)}
                placeholder="List the services you offer..."
                style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Typical Price Range</label>
              <input
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                placeholder="e.g. Jobs typically start at $1,500"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Business Hours</label>
              <input
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g. Mon-Fri 8am-6pm, Sat 9am-2pm"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Preferred Tone</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid",
                      borderColor: tone === t ? "#4ade80" : "rgba(240,253,244,0.15)",
                      background: tone === t ? "rgba(34,197,94,0.15)" : "transparent",
                      color: tone === t ? "#4ade80" : "rgba(240,253,244,0.6)",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Website URL</label>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="yourbusiness.com"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "14px",
                borderRadius: "11px",
                border: "none",
                background: "linear-gradient(135deg,#16a34a,#22c55e)",
                color: "#052e16",
                fontWeight: 700,
                fontSize: "15px",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                marginTop: "8px",
              }}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>

        <div>
          <div
            style={{
              position: "sticky",
              top: "40px",
              background: "rgba(240,253,244,0.03)",
              border: "1px solid rgba(74,222,128,0.15)",
              borderRadius: "16px",
              padding: "24px",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>
              AI Response Preview
            </h2>
            <p style={{ fontSize: "13px", color: "rgba(240,253,244,0.5)", marginBottom: "16px" }}>
              See how your AI will respond to a sample lead, based on the settings on the left.
            </p>

            <button
              onClick={handlePreview}
              disabled={previewLoading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid rgba(74,222,128,0.3)",
                background: "rgba(34,197,94,0.1)",
                color: "#4ade80",
                fontWeight: 700,
                fontSize: "13px",
                cursor: previewLoading ? "not-allowed" : "pointer",
                marginBottom: "16px",
              }}
            >
              {previewLoading ? "Generating..." : "Generate Preview"}
            </button>

            <div
              style={{
                background: "rgba(240,253,244,0.05)",
                borderRadius: "10px",
                padding: "14px",
                minHeight: "120px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: preview ? "#f0fdf4" : "rgba(240,253,244,0.35)",
              }}
            >
              {preview || "Click Generate Preview to see a sample AI response using your current settings."}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
