import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/resendEmail";
import { welcomeEmailHtml } from "@/lib/emailTemplates";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (!userId) {
          console.error("checkout.session.completed missing userId in metadata");
          break;
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            plan: plan ?? null,
            stripe_customer_id:
              typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : null,
          })
          .eq("id", userId);

        if (error) {
          console.error("Failed to update profile after checkout:", error);
        } else {
          try {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("email, business_name")
              .eq("id", userId)
              .single();

            if (profile?.email) {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
              await sendEmail({
                to: profile.email,
                subject: "Welcome to BookIfy AI - let us get your first lead captured",
                html: welcomeEmailHtml(profile.business_name || "there", appUrl + "/dashboard"),
              });
            }
          } catch (emailErr) {
            console.error("Failed to send welcome email:", emailErr);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const plan = subscription.metadata?.plan;

        if (!userId) {
          const customerId =
            typeof subscription.customer === "string" ? subscription.customer : null;
          if (customerId) {
            const { error } = await supabaseAdmin
              .from("profiles")
              .update({
                plan: subscription.status === "active" || subscription.status === "trialing"
                  ? plan ?? null
                  : null,
                stripe_subscription_id: subscription.id,
              })
              .eq("stripe_customer_id", customerId);
            if (error) console.error("Failed to update profile by customer id:", error);
          }
          break;
        }

        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            plan:
              subscription.status === "active" || subscription.status === "trialing"
                ? plan ?? null
                : null,
            stripe_subscription_id: subscription.id,
          })
          .eq("id", userId);

        if (error) console.error("Failed to update profile on subscription update:", error);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : null;

        const query = supabaseAdmin.from("profiles").update({ plan: null });

        const { error } = userId
          ? await query.eq("id", userId)
          : customerId
          ? await query.eq("stripe_customer_id", customerId)
          : { error: new Error("No userId or customerId to identify profile") };

        if (error) console.error("Failed to revoke plan on subscription deletion:", error);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
