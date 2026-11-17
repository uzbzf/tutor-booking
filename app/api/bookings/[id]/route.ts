import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_PIN, BookingStatus, PaymentMethod, PaymentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ok = (req: NextRequest) => req.headers.get("x-admin-pin") === ADMIN_PIN;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!ok(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};

  if (body.status && ["confirmed", "cancelled", "completed"].includes(body.status)) {
    patch.status = body.status as BookingStatus;
  }
  if (body.paymentStatus && ["paid", "pending"].includes(body.paymentStatus)) {
    patch.paymentStatus = body.paymentStatus as PaymentStatus;
  }
  if (body.paymentMethod && ["click", "payme", "stripe", "cash"].includes(body.paymentMethod)) {
    patch.paymentMethod = body.paymentMethod as PaymentMethod;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Нет валидных полей для обновления" }, { status: 400 });
  }

  const updated = db.update(params.id, patch);
  if (!updated) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!ok(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!db.remove(params.id)) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ success: true });
}
