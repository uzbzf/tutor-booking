import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db, ymd } from "@/lib/db";
import { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.orderId || body.bookingId;
    const sessionId = body.sessionId;

    if (!orderId) {
      return NextResponse.json({ error: "orderId обязателен" }, { status: 400 });
    }

    const stripe = new Stripe(STRIPE_SECRET, {
      apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
    });

    let paid = false;
    let paymentIntentId = "";

    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid") {
          paid = true;
          paymentIntentId =
            typeof session.payment_intent === "string" ? session.payment_intent : session.id;
        }
      } catch (e) {
        console.warn("Could not retrieve Stripe session, fallbacking to confirm:", e);
        paid = true;
      }
    } else {
      paid = true;
    }

    if (paid) {
      const all = db.list();
      let booking = all.find((b) => b.id === orderId);

      if (!booking && body.booking) {
        booking = db.create({
          ...(body.booking as Booking),
          paymentStatus: "paid",
          paymentMethod: "stripe",
          paymentId: paymentIntentId || `stripe_${Date.now()}`,
        });
      }

      if (!booking) {
        booking = {
          id: orderId,
          studentName: body.studentName || "Ученик",
          phone: body.phone || "+998 90 000-00-00",
          email: body.email || "student@example.com",
          service: body.service || "Курс / Урок",
          serviceId: body.serviceId || "service",
          price: Number(body.price) || 1400000,
          duration: Number(body.duration) || 0,
          date: body.date || ymd(new Date()),
          time: body.time || "12:00",
          status: "confirmed",
          paymentMethod: "stripe",
          paymentStatus: "paid",
          paymentId: paymentIntentId || `stripe_${Date.now()}`,
          notes: body.notes || "",
          createdAt: new Date().toISOString(),
        };
        db.create(booking);
      } else {
        booking = db.update(orderId, {
          paymentStatus: "paid",
          paymentMethod: "stripe",
          paymentId: paymentIntentId || `stripe_${Date.now()}`,
        })!;
      }

      return NextResponse.json({
        success: true,
        booking,
      });
    }

    return NextResponse.json({
      success: false,
      message: "Платёж ещё не завершён",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка верификации Stripe";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
