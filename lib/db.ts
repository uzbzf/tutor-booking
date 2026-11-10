import fs from "fs";
import path from "path";
import { Booking, SERVICES } from "./types";

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
    id: string, name: string, phone: string, email: string, sid: string,
    date: string, time: string, status: Booking["status"], notes: string
  ): Booking => {
    const s = SERVICES.find((x) => x.id === sid)!;
    return {
      id, studentName: name, phone, email, serviceId: sid, service: s.title,
      price: s.price, duration: s.duration, date, time, status, notes,
      createdAt: new Date().toISOString(),
    };
  };
  return [
    mk("demo0001", "Анна Петрова", "+7 900 123-45-67", "anna@example.com", "lesson", addDays(0), "16:00", "confirmed", "Подготовка к ЕГЭ, профильная математика, параметры"),
    mk("demo0002", "Игорь Смирнов", "@igor_smirnov", "igor@example.com", "mock", addDays(1), "11:30", "confirmed", "Разбор пробника ЕГЭ"),
    mk("demo0003", "Мария Волкова", "+7 911 765-43-21", "maria@example.com", "express", addDays(-3), "13:00", "completed", "Вопросы по производной"),
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
  list: (): Booking[] => readAll().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
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
      .filter((x) => x.date === date && x.status !== "cancelled")
      .map((x) => x.time);
  },
};
