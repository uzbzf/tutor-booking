import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db, ymd } from "@/lib/db";
import { ADMIN_PIN, Booking, SERVICES, TIME_SLOTS } from "@/lib/types";

export const dynamic = "force-dynamic";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-pin") === ADMIN_PIN;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(db.list());
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }
  const str = (k: string) => (typeof body[k] === "string" ? (body[k] as string).trim() : "");
  const studentName = str("studentName");
  const phone = str("phone");
  const email = str("email");
  const notes = str("notes").slice(0, 1000);
  const date = str("date");
  const time = str("time");
  const service = SERVICES.find((s) => s.id === str("serviceId"));

  const errors: Record<string, string> = {};
  if (studentName.length < 2) errors.studentName = "Введите имя";
  if (!/^(\+?[\d\s\-()]{7,20}|@[A-Za-z0-9_]{4,32})$/.test(phone)) errors.phone = "Телефон или @telegram";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Некорректный email";
  if (!service) errors.serviceId = "Выберите услугу";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Выберите дату";
  if (!TIME_SLOTS.includes(time)) errors.time = "Выберите время";
  if (!errors.date && date < ymd(new Date())) errors.date = "Дата в прошлом";
  if (Object.keys(errors).length) return NextResponse.json({ error: "Ошибка валидации", errors }, { status: 400 });

  if (db.busySlots(date).includes(time))
    return NextResponse.json({ error: "Это время уже занято", errors: { time: "Слот занят" } }, { status: 409 });

  const booking: Booking = {
    id: randomUUID().slice(0, 8),
    studentName, phone, email,
    serviceId: service!.id, service: service!.title,
    price: service!.price, duration: service!.duration,
    date, time, status: "confirmed", notes,
    createdAt: new Date().toISOString(),
  };
  db.create(booking);
  return NextResponse.json(booking, { status: 201 });
}
