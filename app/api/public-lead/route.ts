import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { public_key, name, email, phone, message } = body as {
      public_key?: string;
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };

    if (!public_key || !name || !message) {
      return NextResponse.json(
        { error: "Missing required fields: public_key, name, message." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("public_key", public_key)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Invalid public key." }, { status: 404 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    const leadRes = await fetch(origin + "/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: profile.id,
        source: "website",
        name,
        email,
        phone,
        message,
      }),
    });

    const leadData = await leadRes.json();
    return NextResponse.json(leadData, { status: leadRes.status });
  } catch (err) {
    console.error("Public lead intake error:", err);
    return NextResponse.json({ error: "Failed to process lead." }, { status: 500 });
  }
}