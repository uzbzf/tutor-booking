import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, paymentMethod, paymentId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId обязателен" }, { status: 400 });
    }

    const all = db.list();
    const booking = all.find((b) => b.id === bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const updated = db.update(bookingId, {
      paymentStatus: "paid",
      paymentMethod: (paymentMethod || booking.paymentMethod) as PaymentMethod,
      paymentId: paymentId || `pay_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ошибка подтверждения оплаты";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
