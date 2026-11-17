import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db, ymd } from "@/lib/db";
import { ADMIN_PIN, Booking, COURSES, PaymentMethod, PaymentStatus, SERVICES, TIME_SLOTS } from "@/lib/types";

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
  const type = (str("type") === "course" ? "course" : "lesson") as "lesson" | "course";
  const serviceId = str("serviceId");
  let date = str("date");
  let time = str("time");

  // Способ оплаты (по умолчанию click)
  const validMethods: PaymentMethod[] = ["click", "payme", "stripe", "cash"];
  const paymentMethod = (validMethods.includes(str("paymentMethod") as PaymentMethod)
    ? str("paymentMethod")
    : "click") as PaymentMethod;

  const paymentStatus = (str("paymentStatus") === "paid" ? "paid" : "pending") as PaymentStatus;

  const errors: Record<string, string> = {};

  if (studentName.length < 2) errors.studentName = "Введите имя";
  // Поддержка узбекских (+998...), международных номеров и @telegram
  if (!/^(\+?[\d\s\-()]{7,25}|@[A-Za-z0-9_]{3,32})$/.test(phone)) {
    errors.phone = "Введите номер (+998 ...) или @telegram";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Некорректный email";

  let title = "";
  let price = 0;
  let duration = 60;

  if (type === "course") {
    const course = COURSES.find((c) => c.id === serviceId);
    if (!course) {
      errors.serviceId = "Курс не найден";
    } else {
      title = course.title;
      price = course.price;
      duration = 0;
      if (!date) date = ymd(new Date());
      if (!time) time = "12:00";
    }
  } else {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) {
      errors.serviceId = "Выберите услугу";
    } else {
      title = service.title;
      price = service.price;
      duration = service.duration;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Выберите дату";
    if (!TIME_SLOTS.includes(time)) errors.time = "Выберите время";
    if (!errors.date && date < ymd(new Date())) errors.date = "Дата в прошлом";

    if (!errors.date && !errors.time && db.busySlots(date).includes(time)) {
      return NextResponse.json(
        { error: "Это время уже занято", errors: { time: "Слот занят" } },
        { status: 409 }
      );
    }
  }

  if (Object.keys(errors).length) {
    return NextResponse.json({ error: "Ошибка валидации", errors }, { status: 400 });
  }

  const booking: Booking = {
    id: randomUUID().slice(0, 8),
    type,
    studentName,
    phone,
    email,
    serviceId,
    service: title,
    price,
    duration,
    date,
    time,
    status: "confirmed",
    paymentMethod,
    paymentStatus,
    notes,
    createdAt: new Date().toISOString(),
  };

  db.create(booking);
  return NextResponse.json(booking, { status: 201 });
}
