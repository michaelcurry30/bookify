"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type PlanId = "starter" | "growth";

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 197,
    tagline: "For businesses ready to stop losing leads to slow response times.",
    features: [
      "Up to 75 leads/month",
      "60-second AI response, sounds like you",
      "Automatic lead qualification",
      "Books directly into your calendar",
      "Appointment reminders (fewer no-shows)",
      "3-day automated follow-up sequence",
      "Revenue tracking dashboard",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 297,
    tagline: "For businesses ready to capture every lead, every channel.",
    features: [
      "Up to 250 leads/month",
      "Everything in Starter",
      "Website, text, DM & missed-call coverage",
      "Extended automated follow-up (7+ days)",
      "Multi-staff calendar routing",
      "Priority response tuning",
    ],
    highlighted: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startTrial(plan: PlanId) {
    setError(null);
    setLoadingPlan(plan);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoadingPlan(null);
    }
  }

  return (
    <main
      className="min-h-screen py-20 px-4"
      style={{ backgroundColor: "#0a1710" }}
    >
      <div className="mx-auto max-w-5xl text-center">
        <p
          className="text-sm font-semibold uppercase tracking-widest"
          style={{ color: "#22c55e" }}
        >
          Pricing
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Stop losing leads to slow response times
        </h1>
        <p className="mt-4 text-lg" style={{ color: "rgba(240,253,244,0.65)" }}>
          BookIfy responds to every lead in 60 seconds and books them on your calendar.
          Start with a 14-day free trial — no charge until your trial ends.
        </p>
      </div>

      {error && (
        <div
          className="mx-auto mt-8 max-w-md rounded-lg border px-4 py-3 text-center text-sm"
          style={{
            borderColor: "rgba(239,68,68,0.4)",
            backgroundColor: "rgba(239,68,68,0.1)",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      <div className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="relative flex flex-col rounded-2xl border p-8"
            style={{
              backgroundColor: "#0f2318",
              borderColor: plan.highlighted ? "#22c55e" : "rgba(240,253,244,0.1)",
              boxShadow: plan.highlighted
                ? "0 0 0 1px #22c55e, 0 20px 40px -20px rgba(34,197,94,0.35)"
                : "none",
            }}
          >
            {plan.highlighted && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "#22c55e", color: "#04140a" }}
              >
                Most popular
              </span>
            )}

            <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
            <p className="mt-1 text-sm" style={{ color: "rgba(240,253,244,0.55)" }}>
              {plan.tagline}
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">${plan.price}</span>
              <span
                className="text-sm font-medium"
                style={{ color: "rgba(240,253,244,0.5)" }}
              >
                /month
              </span>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: "rgba(240,253,244,0.85)" }}
                >
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0"
                    style={{ color: "#22c55e" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => startTrial(plan.id)}
              disabled={loadingPlan !== null}
              className="mt-8 w-full rounded-lg px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: plan.highlighted ? "#22c55e" : "#153322",
                color: plan.highlighted ? "#04140a" : "#f0fdf4",
                border: plan.highlighted ? "none" : "1px solid rgba(240,253,244,0.15)",
              }}
            >
              {loadingPlan === plan.id ? "Redirecting…" : "Start 14-day trial"}
            </button>
          </div>
        ))}
      </div>

      <p
        className="mx-auto mt-6 max-w-md text-center text-xs"
        style={{ color: "rgba(240,253,244,0.4)" }}
      >
        Consistently going over your plan's lead volume? Reach out and we will get you set up
        with a higher limit.
      </p>

      <p
        className="mx-auto mt-4 max-w-md text-center text-xs"
        style={{ color: "rgba(240,253,244,0.4)" }}
      >
        By starting a trial you agree to be charged $197 to $297/month
        after your 14-day trial ends, unless you cancel first.
      </p>
    </main>
  );
}
