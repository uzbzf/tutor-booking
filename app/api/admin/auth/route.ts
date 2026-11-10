import { NextRequest, NextResponse } from "next/server";
import { ADMIN_PIN } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({ pin: "" }));
  if (pin === ADMIN_PIN) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false, error: "Неверный PIN" }, { status: 401 });
}
