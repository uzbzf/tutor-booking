import fs from "fs";
import path from "path";
import { Booking, COURSES, SERVICES } from "./types";

// На Vercel файловая система read-only, кроме /tmp (данные там эфемерны — для демо этого достаточно).
const DB_DIR = process.env.VERCEL ? "/tmp/tutor-data" : path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "bookings.json");

export function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return ymd(d);
}

function seed(): Booking[] {
  const mk = (
    id: string,
    name: string,
    phone: string,
    email: string,
    sid: string,
    date: string,
    time: string,
    status: Booking["status"],
    paymentMethod: Booking["paymentMethod"],
    paymentStatus: Booking["paymentStatus"],
    type: Booking["type"],
    notes: string
  ): Booking => {
    let serviceTitle = "";
    let price = 0;
    let duration = 60;

    if (type === "course") {
      const c = COURSES.find((x) => x.id === sid);
      serviceTitle = c?.title || "Курс";
      price = c?.price || 1800000;
      duration = 0;
    } else {
      const s = SERVICES.find((x) => x.id === sid) || SERVICES[0];
      serviceTitle = s.title;
      price = s.price;
      duration = s.duration;
    }

    return {
      id,
      type: type || "lesson",
      studentName: name,
      phone,
      email,
      serviceId: sid,
      service: serviceTitle,
      price,
      duration,
      date,
      time,
      status,
      paymentMethod,
      paymentStatus,
      notes,
      createdAt: new Date().toISOString(),
    };
  };

  return [
    mk(
      "demo0001",
      "Сардор Рахимов",
      "+998 90 123-45-67",
      "sardor@example.com",
      "lesson",
      addDays(0),
      "16:00",
      "confirmed",
      "click",
      "paid",
      "lesson",
      "Подготовка к вступительным, профильная математика"
    ),
    mk(
      "demo0002",
      "Дильноза Умарова",
      "+998 93 987-65-43",
      "dilnoza@example.com",
      "course-math-pro",
      addDays(0),
      "12:00",
      "confirmed",
      "payme",
      "paid",
      "course",
      "Приобретен полный курс по профильной математике"
    ),
    mk(
      "demo0003",
      "Азиз Каримов",
      "+998 97 555-44-33",
      "aziz@example.com",
      "mock",
      addDays(1),
      "11:30",
      "confirmed",
      "stripe",
      "pending",
      "lesson",
      "Разбор пробного экзамена по физике"
    ),
    mk(
      "demo0004",
      "Малика Алиева",
      "@malika_al",
      "malika@example.com",
      "express",
      addDays(-2),
      "14:30",
      "completed",
      "click",
      "paid",
      "lesson",
      "Консультация по тригонометрии"
    ),
  ];
}

function readAll(): Booking[] {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    const data = seed();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as Booking[];
  } catch {
    return [];
  }
}

function writeAll(data: Booking[]) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, DB_FILE);
}

export const db = {
  list: (): Booking[] =>
    readAll().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),

  create(b: Booking) {
    const all = readAll();
    all.push(b);
    writeAll(all);
    return b;
  },

  update(id: string, patch: Partial<Booking>): Booking | null {
    const all = readAll();
    const i = all.findIndex((x) => x.id === id);
    if (i < 0) return null;
    all[i] = { ...all[i], ...patch };
    writeAll(all);
    return all[i];
  },

  remove(id: string): boolean {
    const all = readAll();
    const next = all.filter((x) => x.id !== id);
    if (next.length === all.length) return false;
    writeAll(next);
    return true;
  },

  busySlots(date: string): string[] {
    return readAll()
      .filter((x) => x.date === date && x.status !== "cancelled" && x.type !== "course")
      .map((x) => x.time);
  },
};
