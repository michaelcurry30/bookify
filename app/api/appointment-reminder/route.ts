import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Find the start and end of "tomorrow" (in UTC)
    const now = new Date();
    const tomorrowStart = new Date(now);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);
    tomorrowStart.setUTCHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setUTCHours(23, 59, 59, 999);

    const { data: leads, error: leadsError } = await supabaseAdmin
      .from("leads")
      .select("id, user_id, name, email, phone, appointment_time, reminder_sent")
      .eq("status", "booked")
      .eq("reminder_sent", false)
      .gte("appointment_time", tomorrowStart.toISOString())
      .lte("appointment_time", tomorrowEnd.toISOString());

    if (leadsError) {
      console.error("Failed to fetch leads for appointment reminder:", leadsError);
      return NextResponse.json({ error: "Failed to fetch leads." }, { status: 500 });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const lead of leads ?? []) {
      try {
        if (!lead.appointment_time) continue;

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("business_name, booking_link")
          .eq("id", lead.user_id)
          .single();

        const businessName = profile?.business_name || "us";

        const appointmentDate = new Date(lead.appointment_time);
        const formattedTime = appointmentDate.toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        const reminderMsg =
          "Hi " + (lead.name || "there") +
          ", just a reminder that your appointment with " + businessName +
          " is coming up tomorrow at " + formattedTime + ". See you then!" +
          (profile?.booking_link ? "\n\nNeed to reschedule? " + profile.booking_link : "");

        if (lead.email) {
          const { sendEmail } = await import("@/lib/resendEmail");
          await sendEmail({
            to: lead.email,
            subject: "Reminder: your appointment tomorrow with " + businessName,
            html: "<p>" + reminderMsg.replace(/\n/g, "<br/>") + "</p>",
          });
        }

        if (lead.phone) {
          const { sendSms } = await import("@/lib/twilioClient");
          await sendSms({ to: lead.phone, body: reminderMsg });
        }

        await supabaseAdmin
          .from("leads")
          .update({ reminder_sent: true })
          .eq("id", lead.id);

        sent += 1;
      } catch (err) {
        console.error("Reminder failed for lead " + lead.id + ":", err);
        errors.push(lead.id);
      }
    }

    return NextResponse.json({ sent, errors });
  } catch (err) {
    console.error("Appointment reminder job error:", err);
    return NextResponse.json({ error: "Appointment reminder job failed." }, { status: 500 });
  }
}