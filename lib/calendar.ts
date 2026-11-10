import { Booking } from "./types";

function toIcsDate(date: string, time: string, addMin = 0): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const dt = new Date(y, m - 1, d, h, mi + addMin);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}T${p(dt.getHours())}${p(dt.getMinutes())}00`;
}

export function downloadIcs(b: Booking) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tutor Booking//RU",
    "BEGIN:VEVENT",
    `UID:${b.id}@tutor-booking`,
    `DTSTAMP:${toIcsDate(b.date, b.time)}`,
    `DTSTART:${toIcsDate(b.date, b.time)}`,
    `DTEND:${toIcsDate(b.date, b.time, b.duration)}`,
    `SUMMARY:${b.service} — Александр Воронов`,
    `DESCRIPTION:${(b.notes || "").replace(/\n/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `lesson-${b.date}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}
