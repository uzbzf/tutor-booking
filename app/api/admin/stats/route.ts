import { NextRequest, NextResponse } from "next/server";
import { db, ymd } from "@/lib/db";
import { ADMIN_PIN, PaymentMethod } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-pin") !== ADMIN_PIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = db.list();
  const today = ymd(new Date());
  const active = all.filter((b) => b.status !== "cancelled");

  const paidRevenue = active
    .filter((b) => b.paymentStatus === "paid")
    .reduce((s, b) => s + b.price, 0);

  const pendingRevenue = active
    .filter((b) => b.paymentStatus === "pending")
    .reduce((s, b) => s + b.price, 0);

  const totalRevenue = paidRevenue + pendingRevenue;

  const byMethod: Record<PaymentMethod, { count: number; total: number }> = {
    click: { count: 0, total: 0 },
    payme: { count: 0, total: 0 },
    stripe: { count: 0, total: 0 },
    cash: { count: 0, total: 0 },
  };

  active.forEach((b) => {
    const m = (b.paymentMethod || "cash") as PaymentMethod;
    if (byMethod[m]) {
      byMethod[m].count += 1;
      if (b.paymentStatus === "paid") {
        byMethod[m].total += b.price;
      }
    }
  });

  return NextResponse.json({
    total: all.length,
    today: active.filter((b) => b.date === today).length,
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    expectedRevenue: all.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.price, 0),
    earnedRevenue: all.filter((b) => b.status === "completed").reduce((s, b) => s + b.price, 0),
    coursesCount: active.filter((b) => b.type === "course").length,
    lessonsCount: active.filter((b) => b.type !== "course").length,
    byMethod,
  });
}
