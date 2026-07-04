import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/resendEmail";
import { fourDaysLeftHtml, lastDayHtml, trialEndedHtml } from "@/lib/emailTemplates";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function dateOnly(d: Date) {
  return d.toISOString().split("T")[0];
}

async function getStats(userId: string) {
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id, status")
    .eq("user_id", userId);

  const leadsCount = leads?.length ?? 0;
  const bookingsCount = (leads ?? []).filter((l) => l.status === "booked").length;
  return { leadsCount, bookingsCount };
}

export async function POST() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const results = { fourDaysLeft: 0, lastDay: 0, trialEnded: 0, errors: [] as string[] };

  const now = new Date();
  const in4Days = dateOnly(new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000));
  const tomorrow = dateOnly(new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000));
  const yesterday = dateOnly(new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));

  try {
    const { data: fourDayUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, business_name, trial_ends_at")
      .not("email", "is", null)
      .gte("trial_ends_at", in4Days + "T00:00:00")
      .lt("trial_ends_at", in4Days + "T23:59:59");

    for (const user of fourDayUsers ?? []) {
      const { leadsCount, bookingsCount } = await getStats(user.id);
      await sendEmail({
        to: user.email,
        subject: "4 days left in your BookIfy AI trial",
        html: fourDaysLeftHtml(
          user.business_name || "there",
          leadsCount,
          bookingsCount,
          appUrl + "/pricing"
        ),
      });
      results.fourDaysLeft++;
    }
  } catch (err) {
    results.errors.push("4-days-left batch failed: " + String(err));
  }

  try {
    const { data: lastDayUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, business_name, trial_ends_at")
      .not("email", "is", null)
      .gte("trial_ends_at", tomorrow + "T00:00:00")
      .lt("trial_ends_at", tomorrow + "T23:59:59");

    for (const user of lastDayUsers ?? []) {
      const { leadsCount, bookingsCount } = await getStats(user.id);
      await sendEmail({
        to: user.email,
        subject: "Your BookIfy AI trial ends tomorrow",
        html: lastDayHtml(
          user.business_name || "there",
          leadsCount,
          bookingsCount,
          appUrl + "/pricing"
        ),
      });
      results.lastDay++;
    }
  } catch (err) {
    results.errors.push("last-day batch failed: " + String(err));
  }

  try {
    const { data: endedUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, business_name, trial_ends_at, plan")
      .not("email", "is", null)
      .is("plan", null)
      .gte("trial_ends_at", yesterday + "T00:00:00")
      .lt("trial_ends_at", yesterday + "T23:59:59");

    for (const user of endedUsers ?? []) {
      await sendEmail({
        to: user.email,
        subject: "Your BookIfy AI trial has ended",
        html: trialEndedHtml(user.business_name || "there", appUrl + "/pricing"),
      });
      results.trialEnded++;
    }
  } catch (err) {
    results.errors.push("trial-ended batch failed: " + String(err));
  }

  return NextResponse.json(results);
}
