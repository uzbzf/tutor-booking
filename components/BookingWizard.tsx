"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, Clock, Loader2, RotateCcw } from "lucide-react";
import { Booking, SERVICES, Service } from "@/lib/types";
import { downloadIcs } from "@/lib/calendar";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const rub = (n: number) => n.toLocaleString("ru-RU") + " ₽";
const STEPS = ["Услуга", "Дата и время", "Ваши данные"];

type Slot = { time: string; available: boolean };

export default function BookingWizard() {
  const [step, setStep] = useState(0);
  const [service, setService] = useState<Service | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [form, setForm] = useState({ studentName: "", phone: "", email: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Booking | null>(null);
  const [refresh, setRefresh] = useState(0);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    fetch(`/api/slots?date=${date}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .finally(() => setLoadingSlots(false));
  }, [date, refresh]);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))] as (Date | null)[];
  }, [month]);

  const canPrev = month > new Date(today.getFullYear(), today.getMonth(), 1);

  async function submit() {
    const e: Record<string, string> = {};
    if (form.studentName.trim().length < 2) e.studentName = "Введите имя";
    if (!/^(\+?[\d\s\-()]{7,20}|@[A-Za-z0-9_]{4,32})$/.test(form.phone.trim())) e.phone = "Телефон или @telegram";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Некорректный email";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, serviceId: service!.id, date, time }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || { form: data.error || "Ошибка" });
        if (res.status === 409) { setTime(null); setStep(1); setRefresh((n) => n + 1); }
        return;
      }
      setResult(data);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep(0); setService(null); setDate(null); setTime(null); setResult(null); setSlots([]);
    setForm({ studentName: "", phone: "", email: "", notes: "" }); setErrors({});
  }

  const fmtDate = (s: string) => new Date(s + "T00:00").toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="glass p-6 sm:p-8" id="booking">
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-md text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </motion.div>
            <h2 className="mt-4 text-2xl font-bold">Вы записаны! 🎉</h2>
            <p className="mt-1 text-slate-400">Номер записи: <span className="font-mono text-slate-200">{result.id}</span></p>
            <div className="mt-6 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-left text-sm">
              <Row k="Услуга" v={result.service} />
              <Row k="Дата" v={fmtDate(result.date)} />
              <Row k="Время" v={`${result.time} · ${result.duration} мин`} />
              <Row k="Ученик" v={result.studentName} />
              <Row k="Стоимость" v={rub(result.price)} />
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button className="btn-primary" onClick={() => downloadIcs(result)}><CalendarPlus className="h-4 w-4" /> Добавить в календарь</button>
              <button className="btn-ghost" onClick={reset}><RotateCcw className="h-4 w-4" /> Записаться ещё</button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-8 flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 flex-col gap-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500" animate={{ width: i <= step ? "100%" : "0%" }} />
                  </div>
                  <span className={`text-xs ${i <= step ? "text-slate-200" : "text-slate-500"}`}>{i + 1}. {s}</span>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                {step === 0 && (
                  <div>
                    <h2 className="mb-4 text-xl font-bold">Выберите услугу</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                      {SERVICES.map((s) => {
                        const active = service?.id === s.id;
                        return (
                          <motion.button key={s.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                            onClick={() => setService(s)}
                            className={`rounded-3xl border p-5 text-left transition ${active ? "border-indigo-400/70 bg-indigo-500/15 shadow-lg shadow-indigo-500/20" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400"><Clock className="h-3.5 w-3.5" /> {s.duration} мин</div>
                            <div className="mt-2 text-lg font-semibold">{s.title}</div>
                            <p className="mt-1 text-sm text-slate-400">{s.description}</p>
                            <div className="mt-4 bg-gradient-to-r from-indigo-300 to-emerald-300 bg-clip-text text-2xl font-bold text-transparent">{rub(s.price)}</div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-8 md:grid-cols-2">
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-xl font-bold"><CalendarDays className="h-5 w-5 text-indigo-400" />
                          <span className="capitalize">{month.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</span></h2>
                        <div className="flex gap-1">
                          <button className="btn-ghost !p-2" disabled={!canPrev} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Назад"><ChevronLeft className="h-4 w-4" /></button>
                          <button className="btn-ghost !p-2" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Вперёд"><ChevronRight className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-slate-500">
                        {WEEKDAYS.map((w) => <div key={w}>{w}</div>)}
                      </div>
                      <div className="mt-2 grid grid-cols-7 gap-1.5">
                        {days.map((d, i) => {
                          if (!d) return <div key={i} />;
                          const key = ymd(d);
                          const past = d < today;
                          const active = date === key;
                          return (
                            <motion.button key={key} disabled={past} whileTap={{ scale: 0.9 }}
                              onClick={() => { setDate(key); setTime(null); }}
                              className={`aspect-square rounded-xl text-sm transition ${active ? "bg-gradient-to-br from-indigo-500 to-violet-500 font-bold text-white shadow-lg shadow-indigo-500/30" : past ? "text-slate-700" : "bg-white/5 hover:bg-white/15"} ${ymd(today) === key && !active ? "ring-1 ring-emerald-400/60" : ""}`}>
                              {d.getDate()}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold"><Clock className="h-5 w-5 text-indigo-400" /> Время</h2>
                      {!date ? (
                        <p className="text-slate-400">Сначала выберите дату в календаре.</p>
                      ) : loadingSlots ? (
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                      ) : (
                        <>
                          <p className="mb-3 text-sm capitalize text-slate-400">{fmtDate(date)}</p>
                          <div className="grid grid-cols-3 gap-3">
                            {slots.map((s) => (
                              <motion.button key={s.time} disabled={!s.available} whileHover={s.available ? { scale: 1.05 } : {}} whileTap={{ scale: 0.92 }}
                                onClick={() => setTime(s.time)}
                                className={`rounded-2xl border py-3 text-sm font-medium transition ${time === s.time ? "border-transparent bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30" : s.available ? "border-white/10 bg-white/5 hover:border-indigo-400/50" : "cursor-not-allowed border-white/5 text-slate-600 line-through"}`}>
                                {s.time}
                              </motion.button>
                            ))}
                          </div>
                          {errors.time && <p className="mt-3 text-sm text-rose-400">{errors.time}</p>}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Данные ученика</h2>
                      <Field label="Имя" error={errors.studentName}><input className="input" value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} placeholder="Иван Иванов" /></Field>
                      <Field label="Телефон / Telegram" error={errors.phone}><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 900 000-00-00 или @username" /></Field>
                      <Field label="Email" error={errors.email}><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="mail@example.com" /></Field>
                      <Field label="Цель занятия"><textarea className="input min-h-24" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Например: подготовка к ЕГЭ, задачи с параметром" /></Field>
                      {errors.form && <p className="text-sm text-rose-400">{errors.form}</p>}
                    </div>
                    <div className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
                      <h3 className="mb-3 font-semibold">Ваша запись</h3>
                      <div className="space-y-2 text-sm">
                        <Row k="Услуга" v={service!.title} />
                        <Row k="Дата" v={fmtDate(date!)} />
                        <Row k="Время" v={`${time} · ${service!.duration} мин`} />
                        <div className="my-3 border-t border-white/10" />
                        <Row k="Итого" v={rub(service!.price)} />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex justify-between">
              <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
                <ChevronLeft className="h-4 w-4" /> Назад
              </button>
              {step < 2 ? (
                <button className="btn-primary" disabled={(step === 0 && !service) || (step === 1 && (!date || !time))} onClick={() => setStep(step + 1)}>
                  Далее <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button className="btn-primary" disabled={submitting} onClick={submit}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Записаться
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-4"><span className="text-slate-400">{k}</span><span className="text-right font-medium capitalize-first">{v}</span></div>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-slate-400">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
    </label>
  );
}
