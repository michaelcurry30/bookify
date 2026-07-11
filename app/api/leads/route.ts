import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VALID_SOURCES = ["website", "facebook", "instagram", "google", "missed-call"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, source, name, email, phone, message } = body as {
      user_id?: string;
      source?: string;
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };

    if (!user_id || !source || !name || !message) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, source, name, message." },
        { status: 400 }
      );
    }

    if (!VALID_SOURCES.includes(source)) {
      return NextResponse.json(
        { error: "Invalid source. Expected one of: " + VALID_SOURCES.join(", ") + "." },
        { status: 400 }
      );
    }

    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .insert({
        user_id,
        source,
        name,
        email: email ?? null,
        phone: phone ?? null,
        message,
        status: "new",
      })
      .select()
      .single();

    if (leadError || !lead) {
      console.error("Failed to save lead:", leadError);
      return NextResponse.json({ error: "Failed to save lead." }, { status: 500 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("business_name, service_type, ai_context, never_say, booking_link")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      console.error("Failed to load business profile:", profileError);
      return NextResponse.json(
        { error: "Failed to load business profile for AI response." },
        { status: 500 }
      );
    }

    const systemPrompt = "You are responding to a new customer lead AS THE OWNER of this business. Speak in first person as the business, not as an AI or assistant.\n\nBUSINESS PROFILE:\n" +
      (profile.ai_context || ("Business name: " + (profile.business_name ?? "Unknown") + ". Service type: " + (profile.service_type ?? "Unknown") + ".")) +
      "\n\n" + (profile.never_say ? ("IMPORTANT - never say or do: " + profile.never_say) : "") +
      "\n\nINSTRUCTIONS:\n- Respond warmly and specifically to this lead's message, referencing details from the business profile where relevant.\n- Keep the tone friendly, human, and specific to this business type - not generic.\n- Your main goal is to move the conversation toward booking an appointment.\n- Keep the response concise (2-4 sentences), like a real text or chat message, not an email.\n- Do not mention that you are an AI.";

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: "New lead message from " + name + " (via " + source + "): \"" + message + "\"",
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Claude API error:", errText);
      return NextResponse.json(
        { error: "Failed to generate AI response.", leadId: lead.id },
        { status: 502 }
      );
    }

    const aiData = await aiRes.json();
    const aiResponseText: string =
      aiData.content?.find((block: { type: string }) => block.type === "text")?.text ??
      "";

    const { error: convError } = await supabaseAdmin.from("conversations").insert({
      lead_id: lead.id,
      user_id,
      role: "assistant",
      message: aiResponseText,
    });

    if (convError) {
      console.error("Failed to save AI conversation:", convError);
    }

    if (email) {
  try {
    const { sendEmail } = await import("@/lib/resendEmail");
    const { leadResponseEmailHtml } = await import("@/lib/emailTemplates");
    await sendEmail({
      to: email,
      subject: "Re: your message to " + (profile.business_name || "us"),
      html: leadResponseEmailHtml(
        profile.business_name || "the business",
        aiResponseText,
        profile.booking_link || ""
      ),
    });
  } catch (emailErr) {
    console.error("Failed to send lead response email:", emailErr);
  }
}

if (phone) {
  try {
    const { sendSms } = await import("@/lib/twilioClient");
    const bookingText = profile.booking_link ? "\n\nBook here: " + profile.booking_link : "";
    await sendSms({
      to: phone,
      body: aiResponseText + bookingText,
    });
  } catch (smsErr) {
    console.error("Failed to send lead response SMS:", smsErr);
  }
}

    return NextResponse.json({
      leadId: lead.id,
      aiResponse: aiResponseText,
    });
  } catch (err) {
    console.error("Lead capture error:", err);
    return NextResponse.json({ error: "Failed to process lead." }, { status: 500 });
  }
}


