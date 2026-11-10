import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ADMIN_PIN } from "@/lib/types";

export const dynamic = "force-dynamic";

const ok = (req: NextRequest) => req.headers.get("x-admin-pin") === ADMIN_PIN;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!ok(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { status } = await req.json().catch(() => ({}));
  if (!["confirmed", "cancelled", "completed"].includes(status))
    return NextResponse.json({ error: "Неверный статус" }, { status: 400 });
  const updated = db.update(params.id, { status });
  if (!updated) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!ok(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!db.remove(params.id)) return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  return NextResponse.json({ success: true });
}
