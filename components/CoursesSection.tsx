"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Check, Clock, GraduationCap, Loader2, Sparkles, Trophy, Users, X } from "lucide-react";
import { Booking, Course, COURSES, formatUzs, PaymentMethod } from "@/lib/types";
import PaymentModal from "./PaymentModal";

export default function CoursesSection() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [enrollModal, setEnrollModal] = useState<Course | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    paymentMethod: "click" as PaymentMethod,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [successCourse, setSuccessCourse] = useState<string | null>(null);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "Введите ваше имя";
    if (!/^(\+?[\d\s\-()]{7,25}|@[A-Za-z0-9_]{3,32})$/.test(form.phone.trim())) {
      errs.phone = "Введите номер (+998...) или @telegram";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Введите корректный email";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0 || !enrollModal) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          type: "course",
          serviceId: enrollModal.id,
          paymentMethod: form.paymentMethod,
          paymentStatus: "pending",
          notes: `Покупка онлайн-курса: ${enrollModal.title}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || { general: data.error || "Ошибка создания заказа" });
        return;
      }

      const createdBooking: Booking = data;
      setActiveBooking(createdBooking);
      setEnrollModal(null);
      setIsPaymentOpen(true);
      setSuccessCourse(enrollModal.title);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="courses" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Авторские обучающие программы
          </div>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Курсы и программы подготовки
          </h2>
          <p className="mt-1 text-slate-400 text-sm max-w-xl">
            Системное обучение с гарантией результата. Оплата онлайн через <span className="text-cyan-400 font-semibold">Click</span>, <span className="text-teal-400 font-semibold">Payme</span> или международные карты <span className="text-indigo-400 font-semibold">Stripe</span>.
          </p>
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {COURSES.map((course) => {
          const discount = course.oldPrice
            ? Math.round(((course.oldPrice - course.price) / course.oldPrice) * 100)
            : 0;

          return (
            <motion.div
              key={course.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="glass relative flex flex-col justify-between overflow-hidden p-6 sm:p-7 border border-white/10 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              {/* Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-300">
                  {course.badge}
                </span>
                {discount > 0 && (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                    -{discount}%
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <div className="mt-4 flex-1">
                <h3 className="text-xl font-bold leading-snug">{course.title}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {course.description}
                </p>

                {/* Metadata */}
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 border border-white/5">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" /> {course.duration}
                  </span>
                  <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 border border-white/5">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-400" /> {course.lessonsCount} уроков
                  </span>
                  <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 border border-white/5">
                    <GraduationCap className="h-3.5 w-3.5 text-amber-400" /> {course.level}
                  </span>
                </div>

                {/* Features List */}
                <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-slate-300">
                  {course.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing & CTA */}
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-emerald-300">
                    {formatUzs(course.price)}
                  </span>
                  {course.oldPrice && (
                    <span className="text-xs text-slate-500 line-through">
                      {formatUzs(course.oldPrice)}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setEnrollModal(course);
                      setErrors({});
                    }}
                    className="btn-primary w-full text-sm"
                  >
                    Купить курс
                  </button>
                  <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="text-cyan-400 font-semibold">Click</span>
                    <span>•</span>
                    <span className="text-teal-400 font-semibold">Payme</span>
                    <span>•</span>
                    <span className="text-indigo-400 font-semibold">Stripe</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Enrollment & Checkout Modal */}
      <AnimatePresence>
        {enrollModal && (
          <div
            className="fixed inset-0 z-[65] grid place-items-center bg-black/75 p-4 backdrop-blur-md"
            onClick={() => setEnrollModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-lg bg-slate-950/95 p-6 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
                    Оформление курса
                  </span>
                  <h3 className="mt-2 text-2xl font-bold">{enrollModal.title}</h3>
                  <p className="mt-1 text-lg font-extrabold text-emerald-400">
                    {formatUzs(enrollModal.price)}
                  </p>
                </div>
                <button
                  onClick={() => setEnrollModal(null)}
                  className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEnroll} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Имя ученика</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Сардор Рахимов"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Телефон / Telegram</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="+998 90 123-45-67 или @telegram"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-rose-400">{errors.phone}</p>}
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Email (для доступа к материалам)</label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="sardor@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email}</p>}
                </div>

                {/* Choose Payment Method */}
                <div>
                  <label className="text-xs text-slate-400 block mb-2">Способ онлайн-оплаты</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: "click" })}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition ${
                        form.paymentMethod === "click"
                          ? "border-cyan-400 bg-cyan-500/15 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="font-black text-cyan-400">CLICK</span>
                      <span className="text-[10px]">Uzcard/Humo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: "payme" })}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition ${
                        form.paymentMethod === "payme"
                          ? "border-teal-400 bg-teal-500/15 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="font-black text-teal-400">payme</span>
                      <span className="text-[10px]">Uzcard/Humo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: "stripe" })}
                      className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition ${
                        form.paymentMethod === "stripe"
                          ? "border-indigo-400 bg-indigo-500/15 text-white"
                          : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="font-black text-indigo-400">stripe</span>
                      <span className="text-[10px]">Visa/Mastercard</span>
                    </button>
                  </div>
                </div>

                {errors.general && (
                  <p className="text-xs text-rose-400">{errors.general}</p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Оформление...
                      </>
                    ) : (
                      <>Перейти к оплате {formatUzs(enrollModal.price)}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      {activeBooking && (
        <PaymentModal
          booking={activeBooking}
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onSuccess={(updated) => {
            setActiveBooking(updated);
          }}
        />
      )}
    </section>
  );
}
