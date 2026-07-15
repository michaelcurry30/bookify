import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FOLLOW_UP_AFTER_DAYS = 2;

export async function GET() {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - FOLLOW_UP_AFTER_DAYS);

    const { data: leads, error: leadsError } = await supabaseAdmin
      .from("leads")
      .select("id, user_id, name, email, phone, status, created_at")
      .in("status", ["new", "contacted"])
      .lte("created_at", cutoff.toISOString());

    if (leadsError) {
      console.error("Failed to fetch leads for follow-up:", leadsError);
      return NextResponse.json({ error: "Failed to fetch leads." }, { status: 500 });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const lead of leads ?? []) {
      try {
        const { count } = await supabaseAdmin
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("lead_id", lead.id)
          .eq("role", "assistant");

        if ((count ?? 0) >= 2) continue;

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("business_name, booking_link")
          .eq("id", lead.user_id)
          .single();

        const followUpMsg =
          "Hi " + (lead.name || "there") +
          ", just following up on your message - are you still looking to get this taken care of? Happy to answer any questions or get you booked in." +
          (profile?.booking_link ? "\n\nBook here: " + profile.booking_link : "");

        if (lead.email) {
          const { sendEmail } = await import("@/lib/resendEmail");
          await sendEmail({
            to: lead.email,
            subject: "Following up - " + (profile?.business_name || "your inquiry"),
            html: "<p>" + followUpMsg.replace(/\n/g, "<br/>") + "</p>",
          });
        }

        if (lead.phone) {
          const { sendSms } = await import("@/lib/twilioClient");
          await sendSms({ to: lead.phone, body: followUpMsg });
        }

        await supabaseAdmin.from("conversations").insert({
          lead_id: lead.id,
          user_id: lead.user_id,
          role: "assistant",
          message: followUpMsg,
        });

        if (lead.status === "new") {
          await supabaseAdmin
            .from("leads")
            .update({ status: "contacted" })
            .eq("id", lead.id);
        }

        sent += 1;
      } catch (err) {
        console.error("Follow-up failed for lead " + lead.id + ":", err);
        errors.push(lead.id);
      }
    }

    return NextResponse.json({ sent, errors });
  } catch (err) {
    console.error("Follow-up job error:", err);
    return NextResponse.json({ error: "Follow-up job failed." }, { status: 500 });
  }
}