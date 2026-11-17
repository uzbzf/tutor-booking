import { NextRequest, NextResponse } from "next/server";
import { db, ymd } from "@/lib/db";
import { Booking, PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bookingId = body.bookingId || body.id;
    const paymentMethod = (body.paymentMethod || "click") as PaymentMethod;
    const paymentId = body.paymentId || `${paymentMethod}_${Date.now()}`;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId обязателен" }, { status: 400 });
    }

    const all = db.list();
    let booking = all.find((b) => b.id === bookingId);

    // Если заказ был создан на другом инстансе Vercel (serverless container) — сохраняем переданные данные
    if (!booking && body.booking) {
      booking = db.create({
        ...(body.booking as Booking),
        paymentStatus: "paid",
        paymentMethod,
        paymentId,
      });
    }

    if (!booking) {
      // Автоматическое восстановление заказа из переданных полей
      booking = {
        id: bookingId,
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
        paymentMethod,
        paymentStatus: "paid",
        paymentId,
        notes: body.notes || "",
        createdAt: new Date().toISOString(),
      };
      db.create(booking);
    } else {
      booking = db.update(bookingId, {
        paymentStatus: "paid",
        paymentMethod,
        paymentId,
      })!;
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка подтверждения оплаты";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
