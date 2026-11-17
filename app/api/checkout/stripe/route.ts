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
    const origin = req.nextUrl.origin || "http://localhost:3000";

    // Если есть реальный ключ Stripe — создаем Checkout Session
    if (secretKey) {
      const stripe = new Stripe(secretKey, {
        apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
      });

      // В Stripe для валют без делений (или с тийинами)
      // Для UZS в Stripe минимальная единица 100 тийин, как центы: 1 сум = 100 тийин
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
        success_url: `${origin}/?payment=success&orderId=${booking.id}&method=stripe`,
        cancel_url: `${origin}/?payment=cancelled&orderId=${booking.id}`,
      });

      return NextResponse.json({
        mode: "live",
        url: session.url,
        sessionId: session.id,
      });
    }

    // Если ключа нет — возвращаем демо-режим со встроенной оплатой
    return NextResponse.json({
      mode: "demo",
      url: null,
      message: "Stripe запущен в интерактивном демо-режиме (без необходимости вводить секретные API-ключи).",
      booking: {
        id: booking.id,
        service: booking.service,
        price: booking.price,
        formattedPrice: formatUzs(booking.price),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка Stripe Checkout";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
