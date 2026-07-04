import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      business_name,
      business_type,
      services_offered,
      price_range,
      business_hours,
      tone,
      website_url,
    } = body as Record<string, string>;

    const toneInstruction =
      tone === "Professional"
        ? "Write in a polished, professional tone. Avoid slang or casual phrasing."
        : tone === "Casual"
        ? "Write in a relaxed, casual tone, like texting a friend."
        : "Write in a warm, friendly tone - approachable but still competent.";

    const systemPrompt = "You are responding to a new customer lead AS THE OWNER of this business. Speak in first person as the business, not as an AI.\n\nBUSINESS PROFILE:\nBusiness name: " +
      (business_name || "Unknown") + "\nBusiness type: " + (business_type || "Unknown") +
      "\nServices offered: " + (services_offered || "Not specified") +
      "\nTypical price range: " + (price_range || "Not specified") +
      "\nBusiness hours: " + (business_hours || "Not specified") +
      "\nWebsite: " + (website_url || "Not specified") +
      "\n\nTONE: " + toneInstruction +
      "\n\nINSTRUCTIONS:\n- Respond to the sample lead message below.\n- Keep the response concise (2-3 sentences), like a real text message.\n- Move the conversation toward booking an appointment.\n- Do not mention you are an AI.";

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: "Sample lead message: \"Hi, I saw your listing online - do you have any availability this week? Also, what do you typically charge for a job like mine?\"",
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Claude preview error:", errText);
      return NextResponse.json({ error: "Failed to generate preview." }, { status: 502 });
    }

    const aiData = await aiRes.json();
    const text: string =
      aiData.content?.find((block: { type: string }) => block.type === "text")?.text ?? "";

    return NextResponse.json({ preview: text });
  } catch (err) {
    console.error("Preview error:", err);
    return NextResponse.json({ error: "Failed to generate preview." }, { status: 500 });
  }
}
