"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface FeedItem {
  id: number;
  initials: string;
  color: string;
  title: string;
  desc: string;
  meta: string;
  tag: string;
  tagColor: string;
  amount: string;
}

const FEED: FeedItem[] = [
  { id: 1, initials: "MT", color: "#60a5fa", title: "New lead — Marcus T.", desc: "Basement flooding right now — need help ASAP", meta: "Just now", tag: "Replied in 8 sec", tagColor: "#22c55e", amount: "$6,200" },
  { id: 2, initials: "SK", color: "#22c55e", title: "Job booked — Sarah K.", desc: "Fire & smoke assessment · Today 2 pm", meta: "2 min ago", tag: "Confirmed", tagColor: "#22c55e", amount: "$4,800" },
  { id: 3, initials: "JR", color: "#a78bfa", title: "Follow-up sent — James R.", desc: "Has the mold spread since we spoke?", meta: "14 min ago", tag: "Opened ✓", tagColor: "#60a5fa", amount: "$3,100" },
  { id: 4, initials: "RR", color: "#fb923c", title: "Deal won — Rivera Restoration", desc: "$18,400 storm rebuild — booked via AI", meta: "1 hr ago", tag: "Won", tagColor: "#fb923c", amount: "$18,400" },
  { id: 5, initials: "LP", color: "#f472b6", title: "New lead — Linda P.", desc: "Window shattered during the storm last night", meta: "3 min ago", tag: "Replied in 11 sec", tagColor: "#22c55e", amount: "$2,900" },
  { id: 6, initials: "DW", color: "#34d399", title: "Job booked — D. Wilson", desc: "Mold inspection · Tomorrow 9 am", meta: "22 min ago", tag: "Confirmed", tagColor: "#22c55e", amount: "$5,600" },
];

const STEPS = [
  { num: "01", emoji: "💬", title: "Customer reaches out", desc: "Via website chat, SMS, or missed call. BookIfy picks up instantly on every channel, 24/7." },
  { num: "02", emoji: "🎯", title: "AI qualifies the lead", desc: "Asks the right questions — damage type, urgency, location — and scores the lead before you see it." },
  { num: "03", emoji: "📅", title: "Job gets scheduled", desc: "BookIfy books directly into your calendar, sends the customer a confirmation, and notifies your crew." },
  { num: "04", emoji: "💰", title: "You show up & close", desc: "Walk in knowing the full job scope. No phone tag, no surprises. Just show up and win the job." },
];

const RESTORATION = [
  { emoji: "💧", service: "Water Damage", pain: "Homeowner calls at 11 pm in a panic. Your phone goes to voicemail. They call the next company.", result: "BookIfy responds in 8 seconds, qualifies the damage, and books an emergency assessment before you wake up." },
  { emoji: "🔥", service: "Fire & Smoke", pain: "Families need an estimate fast after a fire. Slow response means the adjuster steers them elsewhere.", result: "AI captures the lead, collects insurance info, and schedules a same-day walkthrough — automatically." },
  { emoji: "🍄", service: "Mold Remediation", pain: "Mold leads go cold fast. People get scared and ghost you if you don't follow up the same day.", result: "Instant response plus a 7-day automated follow-up sequence that re-engages cold leads without you lifting a finger." },
  { emoji: "⛈️", service: "Storm Damage", pain: "After a major storm you get 40 calls in 3 hours. You miss half of them and lose thousands in jobs.", result: "Every missed call gets a text-back in seconds. BookIfy triages urgency and fills your schedule from the overflow." },
];

const DOOR = [
  { emoji: "🪟", service: "Window Replacement", pain: "Homeowners shopping for windows get 3 quotes. The first company to respond professionally almost always wins.", result: "BookIfy replies instantly, collects window count and home size, and books a measurement appointment before rivals respond." },
  { emoji: "🚪", service: "Door Replacement", pain: "Door leads come in waves during spring and fall. You can't manually follow up with everyone during peak season.", result: "AI handles the entire intake — style, budget, timeline — and books a consult without you touching anything." },
  { emoji: "🏢", service: "Commercial Window & Door", pain: "Commercial leads are high-value but slow. Without consistent follow-up they go to the national chains.", result: "BookIfy runs a 14-day multi-touch follow-up sequence, keeping your name top-of-mind until they're ready to sign." },
  { emoji: "🛡️", service: "Storm Door & Emergency Glass", pain: "Broken glass after a storm is an emergency. Every minute without a response is a minute a competitor is calling back.", result: "Missed call text-back fires in under 10 seconds. Customer is calmed and booked before they dial a second number." },
];

const TESTIMONIALS = [
  { quote: "We were losing jobs to competitors who answered faster. BookIfy fixed that overnight. First month we recovered $22,000 in jobs we would've missed.", name: "Mike R.", role: "Premier Water Restoration · Phoenix, AZ", initials: "MR", color: "#60a5fa" },
  { quote: "I used to miss calls on weekends constantly. Now I wake up Monday with 8 jobs already scheduled. The AI handles it exactly like I would — but faster.", name: "Jessica L.", role: "Apex Window & Door · Dallas, TX", initials: "JL", color: "#a78bfa" },
  { quote: "Had a mold lead go cold for 4 days. BookIfy followed up automatically and booked a $14,000 job. I did absolutely nothing.", name: "David C.", role: "ClearAir Remediation · Atlanta, GA", initials: "DC", color: "#22c55e" },
  { quote: "After a hailstorm we had 50+ calls in one afternoon. BookIfy triaged every single one and filled our schedule for the next two weeks.", name: "Tara M.", role: "Summit Storm Restoration · Denver, CO", initials: "TM", color: "#fb923c" },
  { quote: "Setup took 12 minutes. By the next morning we had 3 window consults booked overnight. It paid for itself in the first week.", name: "Carlos V.", role: "ClearView Windows · Houston, TX", initials: "CV", color: "#f472b6" },
  { quote: "The response speed alone is a competitive advantage. Customers tell us they chose us because we were the first to get back to them.", name: "Rachel P.", role: "Pinnacle Fire & Smoke · Nashville, TN", initials: "RP", color: "#34d399" },
];

const FAQS = [
  { q: "How long does setup take?", a: "Most businesses are live in under 15 minutes. Answer 4 questions about your business, connect your calendar, and BookIfy handles the rest. No tech skills needed." },
  { q: "What channels does BookIfy cover?", a: "Website chat, SMS/text, Google My Business messages, and missed call text-back. All conversations appear in one inbox — nothing falls through the cracks." },
  { q: "Can I customize what the AI says?", a: "Yes. You control your tone, service area, pricing ranges, and custom intake questions. The AI fully adapts to your specific service type." },
  { q: "What if a customer asks something complex?", a: "BookIfy handles 95%+ of conversations automatically. When something is outside its scope, it flags you immediately so you can step in." },
  { q: "Does it work with my existing software?", a: "BookIfy integrates with Google Calendar, Outlook, ServiceTitan, Jobber, and most field service platforms." },
  { q: "Is there a contract?", a: "No contracts, no cancellation fees. Month-to-month. The 14-day trial needs no credit card — you only pay if you keep it after seeing results." },
];

function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#22c55e" />
      <path d="M9 9h6a3.5 3.5 0 0 1 0 7H9V9Zm0 7h6.5a3.5 3.5 0 0 1 0 7H9v-7Z" fill="#0a1f14" />
    </svg>
  );
}

function LiveFeed() {
  const [items, setItems] = useState(FEED.slice(0, 4));
  const counter = useRef(4);

  useEffect(() => {
    const t = setInterval(() => {
      const next = FEED[counter.current % FEED.length];
      counter.current++;
      setItems(prev => [next, ...prev.slice(0, 3)]);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: "#0d1f14", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "20px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
      <div style={{ background: "linear-gradient(135deg,#166534,#15803d)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 8px #4ade80", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#f0fdf4", letterSpacing: "0.3px" }}>BookIfy AI — Live Feed</span>
        </div>
        <span style={{ fontSize: "11px", fontWeight: 600, color: "rgba(240,253,244,0.6)", background: "rgba(0,0,0,0.2)", padding: "3px 8px", borderRadius: "20px" }}>LIVE</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderBottom: "1px solid rgba(34,197,94,0.1)" }}>
        {[["12", "Leads today"], ["8 sec", "Avg response"], ["7", "Jobs booked"]].map(([v, l]) => (
          <div key={l} style={{ padding: "12px", textAlign: "center", borderRight: "1px solid rgba(34,197,94,0.1)" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#4ade80" }}>{v}</div>
            <div style={{ fontSize: "10px", color: "rgba(240,253,244,0.4)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{l}</div>
          </div>
        ))}
      </div>
      <div>
        {items.map((item, i) => (
          <div key={`${item.id}-${i}`} style={{ display: "flex", gap: "12px", padding: "14px 18px", borderBottom: "1px solid rgba(34,197,94,0.06)", transition: "all 0.4s ease", background: i === 0 ? "rgba(34,197,94,0.04)" : "transparent" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 800, color: "#0a1f14", flexShrink: 0 }}>
              {item.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#f0fdf4" }}>{item.title}</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>{item.amount}</span>
              </div>
              <div style={{ fontSize: "12px", color: "rgba(240,253,244,0.5)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                <span style={{ fontSize: "11px", color: "rgba(240,253,244,0.3)" }}>{item.meta}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: item.tagColor, background: `${item.tagColor}18`, padding: "2px 8px", borderRadius: "20px" }}>{item.tag}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px",
      background: scrolled ? "rgba(10,26,16,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(34,197,94,0.12)" : "1px solid transparent",
      transition: "all 0.3s ease",
    }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
        <Logo size={30} />
        <span style={{ fontSize: "17px", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-0.3px" }}>
          Book<span style={{ color: "#22c55e" }}>Ify</span> AI
        </span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: "32px" }} className="nav-links">
        {[["How it works", "#how-it-works"], ["Features", "#features"], ["Pricing", "#pricing"], ["FAQ", "#faq"]].map(([label, href]) => (
          <a key={label} href={href} style={{ fontSize: "14px", color: "rgba(240,253,244,0.6)", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f0fdf4")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,253,244,0.6)")}>
            {label}
          </a>
        ))}
      </div>
      <Link href="/signup" style={{ padding: "10px 22px", background: "#22c55e", color: "#0a1f14", fontSize: "14px", fontWeight: 700, borderRadius: "10px", textDecoration: "none", transition: "all 0.2s", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#16c653"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "#22c55e"; e.currentTarget.style.transform = "translateY(0)"; }}>
        Start free trial
      </Link>
    </nav>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{ border: "1px solid rgba(34,197,94,0.15)", borderRadius: "14px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s", marginBottom: "10px" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.15)")}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "20px 24px" }}>
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#f0fdf4" }}>{q}</span>
        <span style={{ width: "24px", height: "24px", borderRadius: "50%", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transform: open ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </span>
      </div>
      {open && (
        <div style={{ padding: "0 24px 20px", fontSize: "14px", color: "rgba(240,253,244,0.55)", lineHeight: 1.7, borderTop: "1px solid rgba(34,197,94,0.08)", paddingTop: "16px" }}>
          {a}
        </div>
      )}
    </div>
  );
}

function UseCard({ emoji, service, pain, result }: { emoji: string; service: string; pain: string; result: string }) {
  return (
    <div style={{ background: "#0d1f14", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "18px", padding: "28px", transition: "all 0.3s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.35)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ fontSize: "32px", marginBottom: "16px" }}>{emoji}</div>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#22c55e", marginBottom: "12px" }}>{service}</div>
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(240,253,244,0.3)", marginBottom: "6px" }}>The problem</p>
        <p style={{ fontSize: "14px", color: "rgba(240,253,244,0.55)", lineHeight: 1.6, margin: 0 }}>{pain}</p>
      </div>
      <div style={{ paddingTop: "16px", borderTop: "1px solid rgba(34,197,94,0.1)" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(34,197,94,0.7)", marginBottom: "6px" }}>BookIfy result</p>
        <p style={{ fontSize: "14px", color: "rgba(240,253,244,0.8)", lineHeight: 1.6, margin: 0 }}>{result}</p>
      </div>
    </div>
  );
}

function PricingCard({ name, price, desc, features, featured }: { name: string; price: string; desc: string; features: string[]; featured?: boolean }) {
  return (
    <div style={{
      background: featured ? "linear-gradient(180deg,rgba(34,197,94,0.1) 0%,#0d1f14 100%)" : "#0d1f14",
      border: featured ? "1.5px solid #22c55e" : "1px solid rgba(34,197,94,0.15)",
      borderRadius: "20px", padding: "36px 32px",
      boxShadow: featured ? "0 0 0 1px #22c55e, 0 24px 64px rgba(34,197,94,0.15)" : "none",
      position: "relative", transition: "transform 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-4px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
      {featured && (
        <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#0a1f14", fontSize: "11px", fontWeight: 800, padding: "4px 16px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
          Most popular
        </div>
      )}
      <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "rgba(240,253,244,0.4)", marginBottom: "12px" }}>{name}</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", marginBottom: "4px" }}>
        <span style={{ fontSize: "52px", fontWeight: 800, color: "#f0fdf4", lineHeight: 1, letterSpacing: "-2px" }}>{price}</span>
        {price !== "Custom" && <span style={{ fontSize: "15px", color: "rgba(240,253,244,0.4)", marginBottom: "6px" }}>/mo</span>}
      </div>
      <p style={{ fontSize: "14px", color: "rgba(240,253,244,0.45)", margin: "12px 0 24px", lineHeight: 1.6 }}>{desc}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {features.map(f => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "rgba(240,253,244,0.75)" }}>
            <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            {f}
          </li>
        ))}
      </ul>
      <Link href="/signup" style={{
        display: "block", textAlign: "center", padding: "14px",
        background: featured ? "#22c55e" : "transparent",
        border: featured ? "none" : "1.5px solid rgba(34,197,94,0.3)",
        color: featured ? "#0a1f14" : "#f0fdf4",
        fontSize: "14px", fontWeight: 700, borderRadius: "12px", textDecoration: "none",
        transition: "all 0.2s",
        boxShadow: featured ? "0 4px 20px rgba(34,197,94,0.3)" : "none",
      }}
        onMouseEnter={e => { e.currentTarget.style.background = featured ? "#16c653" : "rgba(34,197,94,0.08)"; e.currentTarget.style.borderColor = "#22c55e"; }}
        onMouseLeave={e => { e.currentTarget.style.background = featured ? "#22c55e" : "transparent"; e.currentTarget.style.borderColor = featured ? "none" : "rgba(34,197,94,0.3)"; }}>
        Start 14-day free trial
      </Link>
      <p style={{ textAlign: "center", fontSize: "11px", color: "rgba(240,253,244,0.25)", margin: "10px 0 0" }}>No credit card required</p>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a1f14", color: "#f0fdf4", fontFamily: "Inter,-apple-system,BlinkMacSystemFont,sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .nav-links { display: flex; }
        @media(max-width:768px){ .nav-links{display:none!important} nav{padding:0 20px!important} .hero-grid{grid-template-columns:1fr!important} .hide-mobile{display:none!important} .stats-grid{grid-template-columns:repeat(2,1fr)!important} .use-grid{grid-template-columns:1fr!important} .pricing-grid{grid-template-columns:1fr!important} .testi-grid{grid-template-columns:1fr!important} .faq-grid{grid-template-columns:1fr!important} }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70vw", height: "70vh", background: "radial-gradient(circle,rgba(34,197,94,0.07) 0%,transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "50vw", height: "50vh", background: "radial-gradient(circle,rgba(34,197,94,0.05) 0%,transparent 70%)", borderRadius: "50%" }} />
      </div>

      <Nav />

      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", zIndex: 1, paddingTop: "64px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "80px 48px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }} className="hero-grid">
          <div style={{ animation: "fadeUp 0.8s ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "100px", marginBottom: "32px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#22c55e", letterSpacing: "0.5px" }}>Live for 2,100+ restoration & window/door companies</span>
            </div>
            <h1 style={{ fontSize: "clamp(42px,5.5vw,72px)", fontWeight: 800, lineHeight: 1.04, letterSpacing: "-2px", color: "#f0fdf4", marginBottom: "24px" }}>
              Never miss<br />a lead again —<br />
              <span style={{ color: "#22c55e", fontStyle: "italic" }}>AI responds<br />in 60 seconds</span>
            </h1>
            <p style={{ fontSize: "18px", color: "rgba(240,253,244,0.55)", lineHeight: 1.65, maxWidth: "480px", marginBottom: "40px" }}>
              BookIfy AI responds to every inquiry, qualifies the lead, and books the job — so you never lose a customer to whoever picks up the phone faster.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "32px" }}>
              <Link href="/signup" style={{ padding: "15px 30px", background: "#22c55e", color: "#0a1f14", fontSize: "15px", fontWeight: 700, borderRadius: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 32px rgba(34,197,94,0.35)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#16c653"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#22c55e"; e.currentTarget.style.transform = "translateY(0)"; }}>
                Start free — 14 days free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
            </div>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              {["No credit card needed", "Cancel anytime", "Setup in 15 minutes"].map(t => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(240,253,244,0.4)" }}>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#22c55e", opacity: 0.7 }} />{t}
                </span>
              ))}
            </div>
          </div>
          <div className="hide-mobile" style={{ animation: "fadeUp 0.8s 0.2s ease both" }}>
            <LiveFeed />
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid rgba(34,197,94,0.12)", borderBottom: "1px solid rgba(34,197,94,0.12)", background: "rgba(13,31,20,0.6)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }} className="stats-grid">
          {[["2,100+", "Active businesses"], ["$84M+", "Revenue booked via AI"], ["8 sec", "Avg. first response"], ["94%", "Lead capture rate"]].map(([val, label]) => (
            <div key={label} style={{ padding: "36px 24px", textAlign: "center", borderRight: "1px solid rgba(34,197,94,0.1)" }}>
              <div style={{ fontSize: "36px", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-1px" }}>{val}</div>
              <div style={{ fontSize: "13px", color: "rgba(240,253,244,0.45)", marginTop: "6px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <section id="how-it-works" style={{ maxWidth: "1280px", margin: "0 auto", padding: "96px 48px", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#22c55e", marginBottom: "16px" }}>How it works</p>
        <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: "16px" }}>
          From missed call to booked job<br /><span style={{ color: "#22c55e", fontStyle: "italic" }}>in minutes</span>
        </h2>
        <p style={{ fontSize: "16px", color: "rgba(240,253,244,0.5)", maxWidth: "520px", lineHeight: 1.65, marginBottom: "64px" }}>
          BookIfy runs 24/7 so you never lose a lead — whether it's 2 pm or 2 am.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }} className="use-grid">
          {STEPS.map((s, i) => (
            <div key={s.num} style={{ background: "#0d1f14", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "18px", padding: "28px", transition: "all 0.3s", position: "relative" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.35)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ fontSize: "42px", fontWeight: 800, color: "rgba(34,197,94,0.08)", letterSpacing: "-2px", lineHeight: 1, marginBottom: "20px" }}>{s.num}</div>
              <div style={{ fontSize: "28px", marginBottom: "16px" }}>{s.emoji}</div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f0fdf4", marginBottom: "10px" }}>{s.title}</h3>
              <p style={{ fontSize: "14px", color: "rgba(240,253,244,0.5)", lineHeight: 1.65 }}>{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="hide-mobile" style={{ position: "absolute", top: "40px", right: "-9px", width: "18px", height: "1px", background: "rgba(34,197,94,0.2)", zIndex: 2 }} />
              )}
            </div>
          ))}
        </div>
      </section>

      <section id="features" style={{ background: "rgba(13,31,20,0.5)", padding: "96px 0", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#22c55e", marginBottom: "16px" }}>Built for restoration companies</p>
          <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: "16px" }}>
            Every type of damage.<br /><span style={{ color: "#22c55e", fontStyle: "italic" }}>Every lead captured.</span>
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(240,253,244,0.5)", maxWidth: "520px", lineHeight: 1.65, marginBottom: "56px" }}>
            Whether it's a flooded basement at midnight or a fire claim during peak season, BookIfy makes sure you're always the first to respond.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }} className="use-grid">
            {RESTORATION.map(u => <UseCard key={u.service} {...u} />)}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: "1280px", margin: "0 auto", padding: "96px 48px", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#22c55e", marginBottom: "16px" }}>Built for window & door companies</p>
        <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: "16px" }}>
          More consults booked.<br /><span style={{ color: "#22c55e", fontStyle: "italic" }}>Zero phone tag.</span>
        </h2>
        <p style={{ fontSize: "16px", color: "rgba(240,253,244,0.5)", maxWidth: "520px", lineHeight: 1.65, marginBottom: "56px" }}>
          Window and door customers decide fast. BookIfy makes sure your business is always first to respond — even when you're on the job.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }} className="use-grid">
          {DOOR.map(u => <UseCard key={u.service} {...u} />)}
        </div>
      </section>

      <section style={{ background: "rgba(13,31,20,0.5)", padding: "96px 0", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#22c55e", marginBottom: "16px" }}>Results</p>
          <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: "56px" }}>
            What our customers <span style={{ color: "#22c55e", fontStyle: "italic" }}>actually say</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }} className="testi-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: "#0d1f14", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "18px", padding: "28px", transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                <div style={{ display: "flex", gap: "2px", marginBottom: "20px" }}>
                  {[...Array(5)].map((_, i) => <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#22c55e"><path d="M7 1l1.5 4H13l-3.6 2.6 1.4 4.4L7 9.5l-3.8 2.5 1.4-4.4L1 5h4.5L7 1Z" /></svg>)}
                </div>
                <p style={{ fontSize: "15px", color: "#f0fdf4", lineHeight: 1.65, fontStyle: "italic", marginBottom: "24px" }}>"{t.quote}"</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#0a1f14", flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#f0fdf4" }}>{t.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(240,253,244,0.4)", marginTop: "2px" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" style={{ maxWidth: "1280px", margin: "0 auto", padding: "96px 48px", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#22c55e", marginBottom: "16px" }}>Pricing</p>
        <h2 style={{ fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: "16px" }}>
          Simple pricing,<br /><span style={{ color: "#22c55e", fontStyle: "italic" }}>serious ROI</span>
        </h2>
        <p style={{ fontSize: "16px", color: "rgba(240,253,244,0.5)", maxWidth: "480px", lineHeight: 1.65, marginBottom: "64px" }}>
          One booked job pays for months of BookIfy. Every plan includes a 14-day free trial — no card needed.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "20px", maxWidth: "820px" }} className="pricing-grid">
          <PricingCard
            name="Starter"
            price="$197"
            desc="For solo operators getting serious about capturing every lead."
            features={["AI chat + SMS response", "Up to 150 leads/month", "Calendar booking", "7-day follow-up sequences", "Missed call text-back", "Google My Business integration"]}
          />
          <PricingCard
            name="Growth"
            price="$297"
            desc="For established businesses tired of losing jobs to faster competitors."
            features={["Everything in Starter", "Unlimited leads", "Lead scoring & priority routing", "Multi-channel (web, SMS, GMB)", "14-day follow-up sequences", "Advanced reporting & ROI tracking"]}
            featured
          />
        </div>
        <p style={{ fontSize: "13px", color: "rgba(240,253,244,0.3)", marginTop: "24px" }}>All plans · No long-term contracts · Cancel anytime</p>
      </section>

      <section id="faq" style={{ background: "rgba(13,31,20,0.5)", padding: "96px 0", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 48px" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#22c55e", marginBottom: "16px" }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-1.5px", lineHeight: 1.08, marginBottom: "48px" }}>
            Questions we get <span style={{ color: "#22c55e", fontStyle: "italic" }}>every day</span>
          </h2>
          {FAQS.map(f => <FAQItem key={f.q} {...f} />)}
        </div>
      </section>

      <section style={{ padding: "80px 48px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(135deg,#0f3d20,#0a2914,#0d3318)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "28px", padding: "80px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 70% at 50% 50%,rgba(34,197,94,0.1),transparent)", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#22c55e", marginBottom: "20px" }}>Get started today</p>
              <h2 style={{ fontSize: "clamp(36px,5vw,60px)", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-2px", lineHeight: 1.06, marginBottom: "20px" }}>
                Stop losing jobs to whoever<br /><span style={{ color: "#22c55e", fontStyle: "italic" }}>picks up first</span>
              </h2>
              <p style={{ fontSize: "17px", color: "rgba(240,253,244,0.5)", maxWidth: "480px", margin: "0 auto 40px", lineHeight: 1.65 }}>
                Join 2,100+ restoration and window & door companies using BookIfy to capture every lead — even at 2 am.
              </p>
              <Link href="/signup" style={{ padding: "16px 36px", background: "#22c55e", color: "#0a1f14", fontSize: "16px", fontWeight: 700, borderRadius: "14px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "0 8px 32px rgba(34,197,94,0.35)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#16c653"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#22c55e"; e.currentTarget.style.transform = "translateY(0)"; }}>
                Start free — 14 days free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M8.5 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <p style={{ fontSize: "13px", color: "rgba(240,253,244,0.3)", marginTop: "20px" }}>
                No credit card · Cancel anytime · <span style={{ color: "#22c55e", fontWeight: 600 }}>Setup in 15 minutes</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(34,197,94,0.12)", padding: "40px 48px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <Logo size={26} />
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#f0fdf4" }}>Book<span style={{ color: "#22c55e" }}>Ify</span> AI</span>
          </Link>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            {[["How it works", "#how-it-works"], ["Features", "#features"], ["Pricing", "#pricing"], ["FAQ", "#faq"]].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: "13px", color: "rgba(240,253,244,0.4)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f0fdf4")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(240,253,244,0.4)")}>
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: "13px", color: "rgba(240,253,244,0.2)" }}>© 2026 BookIfy AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}