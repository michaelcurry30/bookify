import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/resendEmail";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function formatIcsDate(date: Date): string {
  // Formats a date as YYYYMMDDTHHMMSSZ (required .ics format, in UTC)
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildIcsFile(params: {
  businessName: string;
  leadName: string;
  startTime: Date;
  bookingLink?: string;
}): string {
  const { businessName, leadName, startTime, bookingLink } = params;

  // Default appointment length: 1 hour
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

  const now = formatIcsDate(new Date());
  const uid = "bookify-" + Date.now() + "@bookifyai.com";

  const descriptionLines = [
    "Appointment with " + businessName + ".",
    bookingLink ? "More info: " + bookingLink : "",
  ]
    .filter(Boolean)
    .join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookIfy AI//Appointment//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    "UID:" + uid,
    "DTSTAMP:" + now,
    "DTSTART:" + formatIcsDate(startTime),
    "DTEND:" + formatIcsDate(endTime),
    "SUMMARY:Appointment with " + businessName,
    "DESCRIPTION:" + descriptionLines,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, appointmentTime } = body as {
      leadId?: string;
      appointmentTime?: string;
    };

    if (!leadId || !appointmentTime) {
      return NextResponse.json(
        { error: "Missing required fields: leadId, appointmentTime." },
        { status: 400 }
      );
    }

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id, user_id, name, email")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      console.error("Failed to load lead:", leadError);
      return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    }

    if (!lead.email) {
      return NextResponse.json(
        { message: "Lead has no email on file, skipping calendar invite." },
        { status: 200 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("business_name, booking_link")
      .eq("id", lead.user_id)
      .single();

    if (profileError || !profile) {
      console.error("Failed to load business profile:", profileError);
      return NextResponse.json(
        { error: "Failed to load business profile." },
        { status: 500 }
      );
    }

    const startTime = new Date(appointmentTime);
    if (isNaN(startTime.getTime())) {
      return NextResponse.json({ error: "Invalid appointmentTime." }, { status: 400 });
    }

    const businessName = profile.business_name || "the business";

    const icsContent = buildIcsFile({
      businessName,
      leadName: lead.name || "there",
      startTime,
      bookingLink: profile.booking_link || undefined,
    });

    const icsBase64 = Buffer.from(icsContent, "utf-8").toString("base64");

    const formattedTime = startTime.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const html =
      "<p>Hi " + (lead.name || "there") + ",</p>" +
      "<p>Your appointment with <strong>" + businessName + "</strong> is confirmed for:</p>" +
      "<p style='font-size:16px;font-weight:600;'>" + formattedTime + "</p>" +
      "<p>We've attached a calendar invite to this email - just open the attachment to add it to your calendar.</p>" +
      "<p>See you then!</p>";

    await sendEmail({
      to: lead.email,
      subject: "Appointment confirmed with " + businessName,
      html,
      attachments: [
        {
          filename: "appointment.ics",
          content: icsBase64,
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Calendar invite error:", err);
    return NextResponse.json({ error: "Failed to send calendar invite." }, { status: 500 });
  }
}