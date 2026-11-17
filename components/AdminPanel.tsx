"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  CalendarCheck,
  CheckCheck,
  CreditCard,
  DollarSign,
  GraduationCap,
  Lock,
  LogOut,
  Search,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Booking,
  BookingStatus,
  formatUzs,
  PaymentMethod,
  PaymentStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
} from "@/lib/types";

type Stats = {
  total: number;
  today: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  coursesCount: number;
  lessonsCount: number;
  byMethod: Record<PaymentMethod, { count: number; total: number }>;
};

type Filter = "all" | "lessons" | "courses" | "paid" | "pending";

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
  if (!pin) {
    return (
      <PinGate
        onOk={(p) => {
          sessionStorage.setItem("admin-pin", p);
          setPin(p);
        }}
      />
    );
  }
  return (
    <Dashboard
      pin={pin}
      onLogout={() => {
        sessionStorage.removeItem("admin-pin");
        setPin(null);
      }}
    />
  );
}

function PinGate({ onOk }: { onOk: (p: string) => void }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: val }),
    });
    if (r.ok) onOk(val);
    else {
      setErr("Неверный PIN");
      setVal("");
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={submit}
      className="glass mx-auto mt-16 max-w-sm p-8 text-center"
    >
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/30">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-2xl font-bold">Панель репетитора</h1>
      <p className="mt-1 text-sm text-slate-400">Введите PIN-код для доступа (демо: 1234)</p>
      <input
        autoFocus
        type="password"
        inputMode="numeric"
        maxLength={8}
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          setErr("");
        }}
        className="input mt-6 text-center text-2xl tracking-[0.5em]"
        placeholder="••••"
      />
      {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
      <button className="btn-primary mt-4 w-full" disabled={!val}>
        Войти в систему
      </button>
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
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(id: string, status: BookingStatus) {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function togglePaymentStatus(id: string, current: PaymentStatus) {
    const nextStatus = current === "paid" ? "pending" : "paid";
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: nextStatus }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/bookings/${id}`, { method: "DELETE", headers });
    setConfirmDel(null);
    load();
  }

  const ql = q.trim().toLowerCase();
  const shown = bookings.filter((b) => {
    if (filter === "lessons" && b.type === "course") return false;
    if (filter === "courses" && b.type !== "course") return false;
    if (filter === "paid" && b.paymentStatus !== "paid") return false;
    if (filter === "pending" && b.paymentStatus !== "pending") return false;
    if (!ql) return true;
    return (
      b.studentName.toLowerCase().includes(ql) ||
      b.phone.toLowerCase().includes(ql) ||
      b.service.toLowerCase().includes(ql)
    );
  });

  const cards = [
    {
      label: "Оплачено (выручка)",
      value: stats ? formatUzs(stats.paidRevenue) : "–",
      icon: TrendingUp,
      color: "text-emerald-400",
      sub: stats ? `из ${formatUzs(stats.totalRevenue)} общего объема` : "",
    },
    {
      label: "Ожидает оплаты",
      value: stats ? formatUzs(stats.pendingRevenue) : "–",
      icon: Wallet,
      color: "text-amber-400",
      sub: "счетов выставлено",
    },
    {
      label: "Всего заказов",
      value: stats?.total ?? "–",
      icon: Users,
      color: "text-indigo-300",
      sub: stats ? `${stats.lessonsCount} уроков • ${stats.coursesCount} курсов` : "",
    },
    {
      label: "Занятий на сегодня",
      value: stats?.today ?? "–",
      icon: CalendarCheck,
      color: "text-cyan-300",
      sub: "в расписании",
    },
  ];

  const tabs: [Filter, string][] = [
    ["all", "Все"],
    ["lessons", "Уроки"],
    ["courses", "Курсы"],
    ["paid", "Оплачено"],
    ["pending", "Ожидает оплаты"],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Панель управления</h1>
          <p className="text-xs text-slate-400 mt-1">
            Учёт записей, статистика и платежи в сумах (UZS)
          </p>
        </div>
        <button className="btn-ghost !py-2 text-sm" onClick={onLogout}>
          <LogOut className="h-4 w-4" /> Выйти
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-5 relative overflow-hidden"
          >
            <c.icon className={`h-5 w-5 ${c.color}`} />
            <div className="mt-3 text-xl font-black text-white sm:text-2xl">{c.value}</div>
            <div className="text-xs text-slate-400">{c.label}</div>
            {c.sub && <div className="mt-1 text-[11px] text-slate-500">{c.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Payment Gateways Breakdown */}
      {stats?.byMethod && (
        <div className="glass p-5">
          <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
            Выручка по платёжным системам
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-3">
              <span className="text-xs font-bold text-cyan-400">CLICK</span>
              <div className="text-lg font-black mt-1 text-white">
                {formatUzs(stats.byMethod.click?.total || 0)}
              </div>
              <div className="text-[11px] text-slate-400">
                {stats.byMethod.click?.count || 0} платежей
              </div>
            </div>

            <div className="rounded-2xl border border-teal-400/20 bg-teal-950/20 p-3">
              <span className="text-xs font-bold text-teal-400">PAYME</span>
              <div className="text-lg font-black mt-1 text-white">
                {formatUzs(stats.byMethod.payme?.total || 0)}
              </div>
              <div className="text-[11px] text-slate-400">
                {stats.byMethod.payme?.count || 0} платежей
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-400/20 bg-indigo-950/20 p-3">
              <span className="text-xs font-bold text-indigo-400">STRIPE</span>
              <div className="text-lg font-black mt-1 text-white">
                {formatUzs(stats.byMethod.stripe?.total || 0)}
              </div>
              <div className="text-[11px] text-slate-400">
                {stats.byMethod.stripe?.count || 0} платежей
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/40 p-3">
              <span className="text-xs font-bold text-slate-400">ПРИ ВСТРЕЧЕ</span>
              <div className="text-lg font-black mt-1 text-white">
                {formatUzs(stats.byMethod.cash?.total || 0)}
              </div>
              <div className="text-[11px] text-slate-400">
                {stats.byMethod.cash?.count || 0} записей
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          {tabs.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-medium transition ${
                filter === k
                  ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            className="input !pl-10 text-xs sm:text-sm"
            placeholder="Поиск по имени, номеру, курсу"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings & Orders List */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {shown.map((b) => (
            <motion.div
              layout
              key={b.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -30 }}
              className="glass flex flex-col gap-4 p-5 lg:flex-row lg:items-center"
            >
              {/* Type & Date */}
              <div className="min-w-[9.5rem]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                      b.type === "course"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                    }`}
                  >
                    {b.type === "course" ? "КУРС" : "УРОК"}
                  </span>
                  <span className="font-semibold text-sm">
                    {new Date(b.date + "T00:00").toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {b.type === "course" ? "Онлайн доступ" : `${b.time} · ${b.duration} мин`}
                </div>
              </div>

              {/* Student details */}
              <div className="flex-1">
                <div className="font-semibold text-white">{b.studentName}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {b.phone} • {b.email}
                </div>
                {b.notes && (
                  <div className="mt-1 text-xs text-slate-500 italic">«{b.notes}»</div>
                )}
              </div>

              {/* Price & Service */}
              <div className="text-sm lg:text-right min-w-[9rem]">
                <div className="font-medium text-slate-200">{b.service}</div>
                <div className="font-black text-emerald-400 text-base">
                  {formatUzs(b.price)}
                </div>
              </div>

              {/* Payment Method & Status Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                    b.paymentMethod === "click"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                      : b.paymentMethod === "payme"
                      ? "bg-teal-500/20 text-teal-300 border border-teal-400/30"
                      : b.paymentMethod === "stripe"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30"
                      : "bg-slate-700/30 text-slate-300 border border-slate-600/30"
                  }`}
                >
                  {b.paymentMethod}
                </span>

                <button
                  type="button"
                  title="Нажмите, чтобы переключить статус оплаты"
                  onClick={() => togglePaymentStatus(b.id, b.paymentStatus)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold cursor-pointer transition hover:opacity-80 ${
                    b.paymentStatus === "paid"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                      : "bg-amber-500/15 text-amber-300 border-amber-400/30"
                  }`}
                >
                  {b.paymentStatus === "paid" ? "✓ Оплачено" : "⏳ Ожидает"}
                </button>

                <span className={`rounded-full border px-2.5 py-0.5 text-xs ${STATUS_STYLE[b.status]}`}>
                  {STATUS_LABELS[b.status]}
                </span>
              </div>

              {/* Status Action Buttons */}
              <div className="flex gap-1.5 shrink-0">
                <IconBtn
                  title="Подтверждено"
                  onClick={() => setStatus(b.id, "confirmed")}
                  active={b.status === "confirmed"}
                >
                  <CalendarCheck className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Проведено"
                  onClick={() => setStatus(b.id, "completed")}
                  active={b.status === "completed"}
                >
                  <CheckCheck className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Отменено"
                  onClick={() => setStatus(b.id, "cancelled")}
                  active={b.status === "cancelled"}
                >
                  <XCircle className="h-4 w-4" />
                </IconBtn>
                <IconBtn
                  title="Удалить"
                  onClick={() => setConfirmDel(b)}
                  danger
                >
                  <Trash2 className="h-4 w-4" />
                </IconBtn>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {shown.length === 0 && (
          <div className="glass p-10 text-center text-slate-400">
            Записей по выбранному фильтру не найдено
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmDel && (
          <div
            className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setConfirmDel(null)}
          >
            <div
              className="glass w-full max-w-sm bg-slate-900/90 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold">Удалить запись?</h2>
              <p className="mt-1 text-sm text-slate-400">
                {confirmDel.studentName}, {confirmDel.service} ({formatUzs(confirmDel.price)})
              </p>
              <div className="mt-5 flex gap-3">
                <button className="btn-ghost flex-1 text-sm" onClick={() => setConfirmDel(null)}>
                  Отмена
                </button>
                <button
                  className="flex-1 rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold hover:bg-rose-400 transition"
                  onClick={() => remove(confirmDel.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  active,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`grid h-9 w-9 place-items-center rounded-xl border transition active:scale-90 ${
        danger
          ? "border-rose-400/20 text-rose-300 hover:bg-rose-500/15"
          : active
          ? "border-indigo-400/50 bg-indigo-500/20 text-white"
          : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}
