"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, CheckCheck, Lock, LogOut, Search, Trash2, TrendingUp, Users, Wallet, XCircle } from "lucide-react";
import { Booking, BookingStatus, STATUS_LABELS } from "@/lib/types";

type Stats = { total: number; today: number; expectedRevenue: number; earnedRevenue: number };
type Filter = "all" | "upcoming" | "completed";

const rub = (n: number) => n.toLocaleString("ru-RU") + " ₽";
const STATUS_STYLE: Record<BookingStatus, string> = {
  confirmed: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30",
  completed: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  cancelled: "bg-rose-500/15 text-rose-300 border-rose-400/30",
};

export default function AdminPanel() {
  const [pin, setPin] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPin(sessionStorage.getItem("admin-pin"));
    setReady(true);
  }, []);

  if (!ready) return null;
  if (!pin) return <PinGate onOk={(p) => { sessionStorage.setItem("admin-pin", p); setPin(p); }} />;
  return <Dashboard pin={pin} onLogout={() => { sessionStorage.removeItem("admin-pin"); setPin(null); }} />;
}

function PinGate({ onOk }: { onOk: (p: string) => void }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: val }) });
    if (r.ok) onOk(val);
    else { setErr("Неверный PIN"); setVal(""); }
  }
  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit}
      className="glass mx-auto mt-16 max-w-sm p-8 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500"><Lock className="h-6 w-6" /></div>
      <h1 className="mt-4 text-2xl font-bold">Панель репетитора</h1>
      <p className="mt-1 text-sm text-slate-400">Введите PIN-код (демо: 1234)</p>
      <input autoFocus type="password" inputMode="numeric" maxLength={8} value={val} onChange={(e) => { setVal(e.target.value); setErr(""); }}
        className="input mt-6 text-center text-2xl tracking-[0.5em]" placeholder="••••" />
      {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
      <button className="btn-primary mt-4 w-full" disabled={!val}>Войти</button>
    </motion.form>
  );
}

function Dashboard({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [confirmDel, setConfirmDel] = useState<Booking | null>(null);

  const headers = { "x-admin-pin": pin };
  const load = useCallback(async () => {
    const [b, s] = await Promise.all([
      fetch("/api/bookings", { headers: { "x-admin-pin": pin }, cache: "no-store" }),
      fetch("/api/admin/stats", { headers: { "x-admin-pin": pin }, cache: "no-store" }),
    ]);
    if (b.status === 401) return onLogout();
    setBookings(await b.json());
    setStats(await s.json());
  }, [pin, onLogout]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // «реальное время»
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(id: string, status: BookingStatus) {
    await fetch(`/api/bookings/${id}`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/bookings/${id}`, { method: "DELETE", headers });
    setConfirmDel(null);
    load();
  }

  const ql = q.trim().toLowerCase();
  const shown = bookings.filter((b) => {
    if (filter === "upcoming" && b.status !== "confirmed") return false;
    if (filter === "completed" && b.status !== "completed") return false;
    if (!ql) return true;
    return b.studentName.toLowerCase().includes(ql) || b.phone.toLowerCase().includes(ql);
  });

  const cards = [
    { label: "Всего записей", value: stats?.total ?? "–", icon: Users, color: "text-indigo-300" },
    { label: "Ожидаемый доход", value: stats ? rub(stats.expectedRevenue) : "–", icon: Wallet, color: "text-violet-300" },
    { label: "Получено (проведено)", value: stats ? rub(stats.earnedRevenue) : "–", icon: TrendingUp, color: "text-emerald-300" },
    { label: "Записей на сегодня", value: stats?.today ?? "–", icon: CalendarCheck, color: "text-amber-300" },
  ];
  const tabs: [Filter, string][] = [["all", "Все"], ["upcoming", "Предстоящие"], ["completed", "Завершённые"]];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Админ-панель</h1>
        <button className="btn-ghost !py-2" onClick={onLogout}><LogOut className="h-4 w-4" /> Выйти</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-5">
            <c.icon className={`h-5 w-5 ${c.color}`} />
            <div className="mt-3 text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-slate-400">{c.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${filter === k ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white" : "text-slate-400 hover:text-white"}`}>{l}</button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input !pl-10" placeholder="Поиск по имени или телефону" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {shown.map((b) => (
            <motion.div layout key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}
              className="glass flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
              <div className="min-w-[8.5rem]">
                <div className="font-semibold">{new Date(b.date + "T00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "short", weekday: "short" })}</div>
                <div className="text-sm text-slate-400">{b.time} · {b.duration} мин</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold">{b.studentName}</div>
                <div className="text-sm text-slate-400">{b.phone} · {b.email}</div>
                {b.notes && <div className="mt-1 text-sm text-slate-500">«{b.notes}»</div>}
              </div>
              <div className="text-sm lg:text-right">
                <div>{b.service}</div>
                <div className="font-semibold text-emerald-300">{rub(b.price)}</div>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs ${STATUS_STYLE[b.status]}`}>{STATUS_LABELS[b.status]}</span>
              <div className="flex gap-2">
                <IconBtn title="Подтверждено" onClick={() => setStatus(b.id, "confirmed")} active={b.status === "confirmed"}><CalendarCheck className="h-4 w-4" /></IconBtn>
                <IconBtn title="Проведено" onClick={() => setStatus(b.id, "completed")} active={b.status === "completed"}><CheckCheck className="h-4 w-4" /></IconBtn>
                <IconBtn title="Отменено" onClick={() => setStatus(b.id, "cancelled")} active={b.status === "cancelled"}><XCircle className="h-4 w-4" /></IconBtn>
                <IconBtn title="Удалить" onClick={() => setConfirmDel(b)} danger><Trash2 className="h-4 w-4" /></IconBtn>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {shown.length === 0 && <div className="glass p-10 text-center text-slate-400">Записей не найдено</div>}
      </div>

      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setConfirmDel(null)}>
            <div className="glass w-full max-w-sm bg-slate-900/90 p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold">Удалить запись?</h2>
              <p className="mt-1 text-sm text-slate-400">{confirmDel.studentName}, {confirmDel.date} {confirmDel.time}</p>
              <div className="mt-5 flex gap-3">
                <button className="btn-ghost flex-1" onClick={() => setConfirmDel(null)}>Отмена</button>
                <button className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 font-semibold hover:bg-rose-400" onClick={() => remove(confirmDel.id)}>Удалить</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconBtn({ children, title, onClick, active, danger }: { children: React.ReactNode; title: string; onClick: () => void; active?: boolean; danger?: boolean }) {
  return (
    <button title={title} aria-label={title} onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-xl border transition active:scale-90 ${danger ? "border-rose-400/20 text-rose-300 hover:bg-rose-500/15" : active ? "border-indigo-400/50 bg-indigo-500/20 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"}`}>
      {children}
    </button>
  );
}
