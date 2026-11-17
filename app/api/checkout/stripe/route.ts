import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { formatUzs } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId обязателен" }, { status: 400 });
    }

    const all = db.list();
    const booking = all.find((b) => b.id === bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "Stripe Secret Key не настроен в переменных окружения STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.replace(/\/$/, "") ||
      req.nextUrl.origin ||
      "http://localhost:3000";

    const stripe = new Stripe(secretKey, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    });

    // В Stripe для UZS: unit_amount = цена * 100 тийинов
    const unitAmount = booking.price * 100;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "uzs",
            product_data: {
              name: booking.service,
              description: `Заказ #${booking.id} для ${booking.studentName} (${formatUzs(booking.price)})`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        bookingId: booking.id,
      },
      customer_email: booking.email || undefined,
      success_url: `${origin}/?payment=success&orderId=${booking.id}&session_id={CHECKOUT_SESSION_ID}&method=stripe`,
      cancel_url: `${origin}/?payment=cancelled&orderId=${booking.id}`,
    });

    return NextResponse.json({
      mode: "live",
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: unknown) {
    console.error("Stripe Checkout Error:", err);
    const msg = err instanceof Error ? err.message : "Ошибка создания сессии Stripe";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
