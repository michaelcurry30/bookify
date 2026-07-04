import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/resendEmail";
import { welcomeEmailHtml } from "@/lib/emailTemplates";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { user_id } = (await req.json()) as { user_id?: string };

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id." }, { status: 400 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("email, business_name")
      .eq("id", user_id)
      .single();

    if (error || !profile?.email) {
      console.error("Failed to load profile for welcome email:", error);
      return NextResponse.json({ error: "Could not load profile." }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await sendEmail({
      to: profile.email,
      subject: "Welcome to BookIfy AI - let us get your first lead captured",
      html: welcomeEmailHtml(profile.business_name || "there", appUrl + "/dashboard"),
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Welcome email error:", err);
    return NextResponse.json({ error: "Failed to send welcome email." }, { status: 500 });
  }
}
