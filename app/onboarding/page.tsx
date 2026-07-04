"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SERVICE_TYPES = [
  "Water Damage Restoration",
  "Mold Remediation",
  "Fire & Smoke Restoration",
  "Full-Service Restoration",
  "Window Replacement",
  "Door Replacement",
  "Window & Door Full-Service",
  "Commercial Window & Door",
  "HVAC Installation & Repair",
  "Plumbing Services",
  "Roofing & Repair",
  "Other",
];

type FormData = {
  business_name: string;
  service_type: string;
  phone: string;
  website_url: string;
  service_area: string;
  hours: string;
  price_range: string;
  differentiator: string;
  faq1_q: string; faq1_a: string;
  faq2_q: string; faq2_a: string;
  faq3_q: string; faq3_a: string;
  never_say: string;
  booking_link: string;
};

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const TIMES = ["Closed","6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM","9:00 PM"];
type HoursMap = Record<string, { open: string; close: string }>;

const DEFAULT_HOURS: HoursMap = {
  Mon: { open:"8:00 AM", close:"6:00 PM" },
  Tue: { open:"8:00 AM", close:"6:00 PM" },
  Wed: { open:"8:00 AM", close:"6:00 PM" },
  Thu: { open:"8:00 AM", close:"6:00 PM" },
  Fri: { open:"8:00 AM", close:"6:00 PM" },
  Sat: { open:"9:00 AM", close:"2:00 PM" },
  Sun: { open:"Closed",  close:"Closed"  },
};

const STEPS = [
  { id:1,  label:"Business", question:"What's your business name?",            hint:"The name your customers know you by.",                                                  type:"text",     field:"business_name" },
  { id:2,  label:"Service",  question:"What's your primary service?",           hint:"We'll tailor your AI booking experience to this.",                                    type:"select" },
  { id:3,  label:"Contact",  question:"What's your business phone number?",     hint:"Customers will reach you at this number.",                                            type:"tel",      field:"phone" },
  { id:4,  label:"Website",  question:"What's your website URL?",               hint:"Optional — helps the AI reference your services.",                                    type:"url",      field:"website_url",  optional:true },
  { id:5,  label:"Area",     question:"What areas do you serve?",               hint:"City names, zip codes, or counties. e.g. 'Kansas City, Overland Park, 64105'",        type:"textarea", field:"service_area" },
  { id:6,  label:"Hours",    question:"What are your business hours?",          hint:"The AI won't book appointments outside these hours.",                                  type:"hours" },
  { id:7,  label:"Pricing",  question:"What's your typical pricing range?",     hint:"A ballpark is fine. e.g. 'Jobs start at $1,500. Free estimates.'",                    type:"textarea", field:"price_range" },
  { id:8,  label:"Edge",     question:"What makes you different?",              hint:"Why should a lead pick you over a competitor? The AI will use this to sell for you.", type:"textarea", field:"differentiator" },
  { id:9,  label:"FAQs",     question:"What do customers ask most?",            hint:"Add up to 3 questions and your exact answers. The AI will use these word for word.",  type:"faq" },
  { id:10, label:"Limits",   question:"What should the AI never say or do?",   hint:"Optional. e.g. 'Never quote over $5,000. Never promise same-day service.'",           type:"textarea", field:"never_say",     optional:true },
  { id:11, label:"Booking",  question:"Where should leads go to book?",         hint:"Paste your Calendly, Google Calendar, or any scheduling link.",                       type:"url",      field:"booking_link" },
] as const;

const TOTAL = STEPS.length;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hours, setHours] = useState<HoursMap>(DEFAULT_HOURS);
  const [formData, setFormData] = useState<FormData>({
    business_name:"", service_type:"", phone:"", website_url:"",
    service_area:"", hours:"", price_range:"", differentiator:"",
    faq1_q:"", faq1_a:"", faq2_q:"", faq2_a:"", faq3_q:"", faq3_a:"",
    never_say:"", booking_link:"",
  });

  const currentStep = STEPS[step - 1];
  const progressPct = ((step - 1) / TOTAL) * 100;

  function setField(field: keyof FormData, val: string) {
    setFormData(f => ({ ...f, [field]: val }));
    setError("");
  }

  function hoursToString() {
    return DAYS.map(d => {
      const h = hours[d];
      return h.open === "Closed" ? `${d}: Closed` : `${d}: ${h.open}–${h.close}`;
    }).join(", ");
  }

  function validate(): boolean {
    const s = currentStep;
    if (s.type === "select") {
      if (!formData.service_type) { setError("Please choose a service type."); return false; }
      return true;
    }
    if (s.type === "hours") return true;
    if (s.type === "faq") {
      if (!formData.faq1_q.trim() || !formData.faq1_a.trim()) {
        setError("Please fill in at least the first question and answer."); return false;
      }
      return true;
    }
    if ("field" in s && s.field) {
      const val = (formData[s.field as keyof FormData] || "").trim();
      if (!val && !("optional" in s && s.optional)) { setError("This field is required."); return false; }
      if (s.type === "tel" && val.replace(/\D/g,"").length < 10) { setError("Enter a valid 10-digit phone number."); return false; }
      if (s.type === "url" && val) {
        try { new URL(val.startsWith("http") ? val : `https://${val}`); }
        catch { setError("Enter a valid URL."); return false; }
      }
    }
    return true;
  }

  async function handleNext() {
    if (!validate()) return;
    if (step < TOTAL) {
      if (currentStep.type === "hours") setField("hours", hoursToString());
      setStep(s => s + 1);
      return;
    }
    setSaving(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    const fix = (url: string) => url ? (url.startsWith("http") ? url : `https://${url}`) : "";
    const finalHours = formData.hours || hoursToString();

    const faqSummary = [
      formData.faq1_q ? `Q: ${formData.faq1_q}\nA: ${formData.faq1_a}` : "",
      formData.faq2_q ? `Q: ${formData.faq2_q}\nA: ${formData.faq2_a}` : "",
      formData.faq3_q ? `Q: ${formData.faq3_q}\nA: ${formData.faq3_a}` : "",
    ].filter(Boolean).join("\n\n");

    const ai_context = `
Business: ${formData.business_name}
Service: ${formData.service_type}
Phone: ${formData.phone}
Website: ${fix(formData.website_url)}
Service Area: ${formData.service_area}
Hours: ${finalHours}
Pricing: ${formData.price_range}
What makes us different: ${formData.differentiator}
FAQs:
${faqSummary}
Never say or do: ${formData.never_say || "N/A"}
Booking link: ${fix(formData.booking_link)}
    `.trim();

    const { error: dbError } = await supabase.from("profiles").upsert(
      {
        ...(user?.id ? { id: user.id } : {}),
        business_name: formData.business_name,
        service_type: formData.service_type,
        phone: formData.phone,
        website_url: fix(formData.website_url),
        service_area: formData.service_area,
        business_hours: finalHours,
        price_range: formData.price_range,
        differentiator: formData.differentiator,
        faq_1_q: formData.faq1_q, faq_1_a: formData.faq1_a,
        faq_2_q: formData.faq2_q, faq_2_a: formData.faq2_a,
        faq_3_q: formData.faq3_q, faq_3_a: formData.faq3_a,
        never_say: formData.never_say,
        booking_link: fix(formData.booking_link),
        ai_context,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    setSaving(false);
    if (dbError) { setError(dbError.message || "Couldn't save. Please try again."); return; }
    router.push("/pricing");
  }

  const inputStyle: React.CSSProperties = { width:"100%", padding:"14px 16px", background:"rgba(240,253,244,0.05)", border:"1.5px solid rgba(74,222,128,0.18)", borderRadius:"11px", color:"#f0fdf4", fontSize:"15px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  const textareaStyle: React.CSSProperties = { ...inputStyle, resize:"vertical", minHeight:"110px" };
  const smSelectStyle: React.CSSProperties = { ...inputStyle, padding:"8px 10px", fontSize:"13px", appearance:"none", cursor:"pointer" };

  function renderInput() {
    const s = currentStep;

    if (s.type === "select") return (
      <div style={{ position:"relative" }}>
        <select value={formData.service_type} onChange={e => setField("service_type", e.target.value)}
          style={{ ...inputStyle, padding:"14px 44px 14px 16px", appearance:"none", cursor:"pointer" }}>
          <option value="" disabled>Choose your service type...</option>
          {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"#4ade80" }}>▾</span>
      </div>
    );

    if (s.type === "hours") return (
      <div>
        <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 1fr", gap:"8px", marginBottom:"10px" }}>
          <span style={{ fontSize:"11px", color:"rgba(240,253,244,0.3)" }} />
          <span style={{ fontSize:"11px", color:"rgba(240,253,244,0.3)", textAlign:"center" }}>Opens</span>
          <span style={{ fontSize:"11px", color:"rgba(240,253,244,0.3)", textAlign:"center" }}>Closes</span>
        </div>
        {DAYS.map(d => (
          <div key={d} style={{ display:"grid", gridTemplateColumns:"60px 1fr 1fr", gap:"8px", alignItems:"center", marginBottom:"8px" }}>
            <span style={{ fontSize:"13px", color:"rgba(240,253,244,0.6)", fontWeight:500 }}>{d}</span>
            <select value={hours[d].open} onChange={e => setHours(h => ({ ...h, [d]: { ...h[d], open:e.target.value } }))} style={smSelectStyle}>
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={hours[d].close} disabled={hours[d].open === "Closed"}
              onChange={e => setHours(h => ({ ...h, [d]: { ...h[d], close:e.target.value } }))}
              style={{ ...smSelectStyle, opacity: hours[d].open === "Closed" ? 0.3 : 1 }}>
              {TIMES.filter(t => t !== "Closed").map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))}
      </div>
    );

    if (s.type === "faq") return (
      <div>
        {([1,2,3] as const).map(n => (
          <div key={n} style={{ background:"rgba(240,253,244,0.03)", border:"1px solid rgba(74,222,128,0.1)", borderRadius:"12px", padding:"16px", marginBottom:"12px" }}>
            <div style={{ fontSize:"11px", fontWeight:600, color:"rgba(74,222,128,0.7)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"6px" }}>
              Question {n}{n > 1 ? " (optional)" : ""}
            </div>
            <input
              placeholder={n===1?"e.g. How fast can you respond?":n===2?"e.g. Do you work with insurance?":"e.g. What areas do you cover?"}
              value={formData[`faq${n}_q` as keyof FormData]}
              onChange={e => setField(`faq${n}_q` as keyof FormData, e.target.value)}
              style={{ ...inputStyle, marginBottom:"8px", fontSize:"14px", padding:"10px 14px" }}
            />
            <div style={{ fontSize:"11px", fontWeight:600, color:"rgba(74,222,128,0.7)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"6px" }}>Answer</div>
            <textarea
              placeholder={n===1?"e.g. We respond within 60 seconds, day or night.":n===2?"e.g. Yes, we work with all major insurance providers.":"e.g. We serve the greater Kansas City metro area."}
              value={formData[`faq${n}_a` as keyof FormData]}
              onChange={e => setField(`faq${n}_a` as keyof FormData, e.target.value)}
              style={{ ...textareaStyle, minHeight:"70px", fontSize:"14px", padding:"10px 14px" }}
            />
          </div>
        ))}
      </div>
    );

    if (s.type === "textarea") return (
      <textarea key={step} autoFocus
        placeholder={
          "field" in s && s.field === "service_area"   ? "e.g. Kansas City, Overland Park, Lee's Summit, 64105, 64106" :
          "field" in s && s.field === "price_range"    ? "e.g. Jobs typically start at $1,500. We offer free on-site estimates." :
          "field" in s && s.field === "differentiator" ? "e.g. We respond within 60 minutes, 24/7. Family owned 15 years. 5-star rated on Google." :
          "e.g. Never quote a price over $5,000. Never promise same-day service on weekends."
        }
        value={"field" in s && s.field ? formData[s.field as keyof FormData] : ""}
        onChange={e => "field" in s && s.field && setField(s.field as keyof FormData, e.target.value)}
        style={textareaStyle}
      />
    );

    return (
      <input key={step} autoFocus
        type={s.type}
        placeholder={
          "field" in s && s.field === "booking_link" ? "https://calendly.com/yourbusiness" :
          s.type === "tel"                           ? "(555) 000-0000" :
          "field" in s && s.field === "website_url"  ? "yourbusiness.com (optional)" :
          "e.g. Pinnacle Restoration Co."
        }
        value={"field" in s && s.field ? formData[s.field as keyof FormData] : ""}
        onChange={e => "field" in s && s.field && setField(s.field as keyof FormData, e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleNext()}
        style={inputStyle}
      />
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#052e16", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px", fontFamily:"Inter,system-ui,sans-serif" }}>
      <div style={{ width:"100%", maxWidth:"560px", background:"rgba(5,46,22,0.55)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:"20px", padding:"44px", backdropFilter:"blur(24px)", boxShadow:"0 32px 80px rgba(0,0,0,0.5)" }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"36px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="7" fill="#4ADE80"/>
            <path d="M7 12h10M12 7v10" stroke="#052e16" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize:"18px", fontWeight:700, color:"#f0fdf4" }}>BookIfy AI</span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom:"40px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
            {STEPS.map(s => (
              <span key={s.id} style={{ fontSize:"10px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.08em", color: step > s.id ? "rgba(74,222,128,0.5)" : step === s.id ? "#4ade80" : "rgba(240,253,244,0.15)" }}>
                {s.id < step ? "✓" : s.id === step ? s.label : "·"}
              </span>
            ))}
          </div>
          <div style={{ height:"3px", background:"rgba(74,222,128,0.12)", borderRadius:"99px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progressPct}%`, background:"linear-gradient(90deg,#16a34a,#4ade80)", borderRadius:"99px", transition:"width 0.45s ease" }} />
          </div>
          <p style={{ marginTop:"8px", fontSize:"12px", color:"rgba(240,253,244,0.3)", textAlign:"right" }}>Step {step} of {TOTAL}</p>
        </div>

        {/* Question */}
        <div style={{ marginBottom:"28px" }}>
          <div style={{ fontSize:"13px", fontWeight:700, color:"#4ade80", letterSpacing:"0.12em", marginBottom:"10px" }}>
            {String(step).padStart(2,"0")}
          </div>
          <h1 style={{ fontSize:"24px", fontWeight:700, color:"#f0fdf4", margin:"0 0 6px" }}>{currentStep.question}</h1>
          <p style={{ fontSize:"13px", color:"rgba(240,253,244,0.38)", margin:"0 0 20px" }}>{currentStep.hint}</p>
          {renderInput()}
          {error && (
            <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"10px", padding:"12px 14px", color:"#fca5a5", fontSize:"14px", marginTop:"12px" }}>
              {error}
            </div>
          )}
        </div>

        {/* Buttons */}
        <button onClick={handleNext} disabled={saving}
          style={{ width:"100%", padding:"14px", background:"linear-gradient(135deg,#16a34a,#22c55e)", border:"none", borderRadius:"11px", color:"#052e16", fontSize:"15px", fontWeight:700, fontFamily:"inherit", cursor:"pointer", opacity:saving?0.7:1 }}>
          {saving ? "Saving..." : step === TOTAL ? "Finish & see plans →" : "Continue →"}
        </button>
        {step > 1 && (
          <button onClick={() => { setStep(s => s - 1); setError(""); }}
            style={{ display:"block", margin:"14px auto 0", background:"none", border:"none", color:"rgba(240,253,244,0.35)", fontSize:"14px", fontFamily:"inherit", cursor:"pointer", padding:"4px 8px" }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}