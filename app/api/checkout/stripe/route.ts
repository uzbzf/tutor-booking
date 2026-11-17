import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, ymd } from "@/lib/db";
import { Booking, formatUzs } from "@/lib/types";

export const dynamic = "force-dynamic";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bookingId = body.bookingId || body.id;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId обязателен" }, { status: 400 });
    }

    const all = db.list();
    let booking = all.find((b) => b.id === bookingId);

    // Если заказ был создан на другом инстансе Vercel (serverless container) — сохраняем переданные данные
    if (!booking && body.booking) {
      booking = db.create(body.booking as Booking);
    }

    if (!booking) {
      // Автоматическое восстановление заказа из переданных полей
      booking = {
        id: bookingId,
        studentName: body.studentName || "Ученик",
        phone: body.phone || "+998 90 000-00-00",
        email: body.email || "student@example.com",
        service: body.service || "Обучающий курс",
        serviceId: body.serviceId || "course",
        price: Number(body.price) || 1400000,
        duration: Number(body.duration) || 0,
        date: body.date || ymd(new Date()),
        time: body.time || "12:00",
        status: "confirmed",
        paymentMethod: "stripe",
        paymentStatus: "pending",
        notes: body.notes || "",
        createdAt: new Date().toISOString(),
      };
      db.create(booking);
    }

    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.replace(/\/$/, "") ||
      req.nextUrl.origin ||
      "http://localhost:3000";

    const stripe = new Stripe(STRIPE_SECRET, {
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
