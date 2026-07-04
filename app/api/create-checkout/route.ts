import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

// Map plan ids from the client to the correct Stripe Price ID from env.
const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = (await req.json()) as { plan?: string };

    if (!plan || !(plan in PRICE_IDS)) {
      return NextResponse.json(
        { error: "Invalid or missing plan. Expected 'starter' or 'growth'." },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Missing Stripe price id for plan '${plan}'. Check .env.local.`,
        },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Not signed in. Please log in and try again." },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not signed in. Please log in and try again." },
        { status: 401 }
      );
    }

    const origin =
      req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId: user.id,
          plan,
        },
      },
      metadata: {
        userId: user.id,
        plan,
      },
      customer_email: user.email,
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/pricing?cancelled=true`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
