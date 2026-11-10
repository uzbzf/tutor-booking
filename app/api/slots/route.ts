import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { TIME_SLOTS } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "date required" }, { status: 400 });
  const busy = db.busySlots(date);
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  const nowHm = `${p(now.getHours())}:${p(now.getMinutes())}`;
  const slots = TIME_SLOTS.map((time) => ({
    time,
    available: !busy.includes(time) && !(date < today) && !(date === today && time <= nowHm),
  }));
  return NextResponse.json({ date, slots });
}
