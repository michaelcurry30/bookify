"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  async function handleSignup() {
    setError("");
    if (!email || !password) { setError("Email and password are required."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    const { error: e } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (e) { setError(e.message); return; }
    router.push("/onboarding");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a1f14", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Inter,system-ui,sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(34,197,94,0.1) 0%, transparent 60%)", pointerEvents: "none" }} />
      <div style={{ width: "100%", maxWidth: "460px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "36px", justifyContent: "center" }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#22c55e" />
            <path d="M9 9h6a3.5 3.5 0 0 1 0 7H9V9Zm0 7h6.5a3.5 3.5 0 0 1 0 7H9v-7Z" fill="#0a1f14" />
          </svg>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#f0fdf4", letterSpacing: "-0.5px" }}>Book<span style={{ color: "#22c55e" }}>Ify</span> AI</span>
        </div>

        <div style={{ background: "rgba(13,31,20,0.9)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "20px", padding: "40px", backdropFilter: "blur(20px)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "#f0fdf4", margin: "0 0 8px", letterSpacing: "-0.5px" }}>Create your account</h1>
          <p style={{ fontSize: "14px", color: "rgba(240,253,244,0.45)", margin: "0 0 28px" }}>Start your 14-day free trial. No credit card required.</p>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", padding: "12px 14px", color: "#fca5a5", fontSize: "14px", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(240,253,244,0.6)", marginBottom: "7px" }}>Email</label>
            <input
              autoFocus
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              style={{ width: "100%", padding: "13px 16px", background: "rgba(34,197,94,0.06)", border: "1.5px solid rgba(34,197,94,0.2)", borderRadius: "11px", color: "#f0fdf4", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(240,253,244,0.6)", marginBottom: "7px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={show ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                style={{ width: "100%", padding: "13px 48px 13px 16px", background: "rgba(34,197,94,0.06)", border: "1.5px solid rgba(34,197,94,0.2)", borderRadius: "11px", color: "#f0fdf4", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
              />
              <button onClick={() => setShow(v => !v)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(240,253,244,0.4)", cursor: "pointer", fontSize: "16px" }}>
                {show ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "rgba(240,253,244,0.6)", marginBottom: "7px" }}>Confirm password</label>
            <input
              type={show ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSignup()}
              style={{ width: "100%", padding: "13px 16px", background: "rgba(34,197,94,0.06)", border: "1.5px solid rgba(34,197,94,0.2)", borderRadius: "11px", color: "#f0fdf4", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{ width: "100%", padding: "14px", background: "#22c55e", border: "none", borderRadius: "12px", color: "#0a1f14", fontSize: "15px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginBottom: "20px", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(34,197,94,0.3)" }}
          >
            {loading ? "Creating account..." : "Create account →"}
          </button>

          <p style={{ textAlign: "center", fontSize: "14px", color: "rgba(240,253,244,0.4)", margin: 0 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#22c55e", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
