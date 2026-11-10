import { NextRequest, NextResponse } from "next/server";
import { db, ymd } from "@/lib/db";
import { ADMIN_PIN } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-pin") !== ADMIN_PIN)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = db.list();
  const today = ymd(new Date());
  const active = all.filter((b) => b.status !== "cancelled");
  return NextResponse.json({
    total: all.length,
    today: active.filter((b) => b.date === today).length,
    expectedRevenue: all.filter((b) => b.status === "confirmed").reduce((s, b) => s + b.price, 0),
    earnedRevenue: all.filter((b) => b.status === "completed").reduce((s, b) => s + b.price, 0),
  });
}
