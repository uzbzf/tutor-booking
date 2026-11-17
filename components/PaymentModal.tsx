"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Booking, PaymentMethod, formatUzs } from "@/lib/types";

interface PaymentModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBooking: Booking) => void;
}

interface ReceiptData {
  receiptNumber: string;
  fiscalSign: string;
  dateTime: string;
  method: "click" | "payme" | "stripe";
  amount: number;
  service: string;
  studentName: string;
  phone: string;
  cardMask: string;
}

export default function PaymentModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"click" | "payme" | "stripe">(
    (booking.paymentMethod === "cash" ? "click" : booking.paymentMethod) as
      | "click"
      | "payme"
      | "stripe"
  );
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  if (!isOpen) return null;

  // Обработка кнопки "Я оплатил" для Click и Payme (демо-процессинг с выдачей чека)
  async function handleDemoPayment(method: "click" | "payme") {
    setLoading(true);
    try {
      const receiptNo =
        method === "click"
          ? `CLK-${Math.floor(100000 + Math.random() * 900000)}`
          : `PM-${Math.floor(100000 + Math.random() * 900000)}`;

      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: method,
          paymentId: receiptNo,
        }),
      });

      const data = await res.json();
      if (res.ok && data.booking) {
        const now = new Date();
        const formattedDateTime = now.toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

        const newReceipt: ReceiptData = {
          receiptNumber: receiptNo,
          fiscalSign: `UZ-FS-${Math.floor(10000000 + Math.random() * 90000000)}`,
          dateTime: formattedDateTime,
          method,
          amount: booking.price,
          service: booking.service,
          studentName: booking.studentName,
          phone: booking.phone,
          cardMask: "Uzcard/Humo •••• " + Math.floor(1000 + Math.random() * 9000),
        };

        setReceipt(newReceipt);
        onSuccess(data.booking);
      }
    } finally {
      setLoading(false);
    }
  }

  // Обработка РЕАЛЬНОЙ сессии Stripe Checkout
  async function handleStripeRealCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();

      if (data.url) {
        // Перенаправление на официальную страницу Stripe Checkout
        window.location.href = data.url;
        return;
      }

      if (data.error) {
        alert("Ошибка Stripe: " + data.error);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка перехода на Stripe";
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] grid place-items-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass relative w-full max-w-lg overflow-hidden bg-slate-950/95 p-6 sm:p-8 my-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                  {receipt ? "Электронный чек" : "Оплата заказа"}
                </span>
                <span className="text-xs text-slate-400">#{booking.id}</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold">{booking.service}</h2>
              {!receipt && (
                <p className="mt-1 text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-emerald-300">
                  {formatUzs(booking.price)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Electronic Receipt View */}
          {receipt ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 space-y-4"
            >
              {/* Receipt Body */}
              <div
                id="printable-receipt"
                className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/30 to-slate-900/90 p-5 shadow-2xl space-y-4 text-xs font-mono"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-black text-sm uppercase ${
                        receipt.method === "click"
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-teal-500/20 text-teal-300"
                      }`}
                    >
                      {receipt.method === "click" ? "CLICK UP" : "PAYME"}
                    </span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> ОПЛАЧЕНО
                    </span>
                  </div>
                  <span className="text-slate-400 font-bold">{receipt.receiptNumber}</span>
                </div>

                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Дата и время:</span>
                    <span>{receipt.dateTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Получатель:</span>
                    <span className="font-semibold text-white">Репетитор А. В. Воронов</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Плательщик:</span>
                    <span className="text-white">{receipt.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Телефон:</span>
                    <span>{receipt.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Способ списания:</span>
                    <span>{receipt.cardMask}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Фискальный код:</span>
                    <span className="text-slate-400">{receipt.fiscalSign}</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-white/10 pt-3 text-sm">
                    <span className="font-bold text-white uppercase font-sans">ИТОГО ОПЛАЧЕНО:</span>
                    <span className="text-lg font-black text-emerald-400">
                      {formatUzs(receipt.amount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-white/10 pt-3 text-[10px] text-slate-500">
                  <span>Чек сформирован платёжным шлюзом</span>
                  <span>Статус: Подтверждён</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-ghost flex-1 text-xs gap-1.5 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/10"
                >
                  <Printer className="h-4 w-4" /> Распечатать чек
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary flex-1 text-xs"
                >
                  Готово, закрыть
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Payment Method Selector Tabs */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("click")}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition ${
                    activeTab === "click"
                      ? "border-cyan-400 bg-cyan-500/15 shadow-lg shadow-cyan-500/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-base font-black tracking-wider text-cyan-400">CLICK</span>
                  <span className="text-[11px] text-slate-400">Uzcard / Humo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("payme")}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition ${
                    activeTab === "payme"
                      ? "border-teal-400 bg-teal-500/15 shadow-lg shadow-teal-500/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-base font-black tracking-wider text-teal-400">payme</span>
                  <span className="text-[11px] text-slate-400">Uzcard / Humo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("stripe")}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition ${
                    activeTab === "stripe"
                      ? "border-indigo-400 bg-indigo-500/15 shadow-lg shadow-indigo-500/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-base font-black tracking-wider text-indigo-400">stripe</span>
                  <span className="text-[11px] text-slate-400">Visa / Mastercard</span>
                </button>
              </div>

              {/* Tab 1: Click */}
              {activeTab === "click" && (
                <div className="mt-6 space-y-4 rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs">
                        UZ
                      </span>
                      <div>
                        <div className="font-semibold text-white">Click Up (Демо-версия)</div>
                        <div className="text-xs text-slate-400">Мгновенный чек и подтверждение</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                      {formatUzs(booking.price)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-900/80 p-4 rounded-xl border border-white/5">
                    <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-white p-2">
                      <QrCode className="h-20 w-20 text-slate-900" />
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="font-semibold text-white">Оплата через Click:</p>
                      <p>1. Отсканируйте QR-код в приложении Click</p>
                      <p>2. Проверьте сумму: {formatUzs(booking.price)}</p>
                      <p>3. Нажмите кнопку ниже для подтверждения и получения чека</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDemoPayment("click")}
                    disabled={loading}
                    className="btn-primary w-full !from-cyan-500 !to-blue-600 text-sm font-bold py-3.5 shadow-lg shadow-cyan-500/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Формирование электронного чека...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Я оплатил через Click (Получить чек)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 2: Payme */}
              {activeTab === "payme" && (
                <div className="mt-6 space-y-4 rounded-2xl border border-teal-400/20 bg-teal-950/20 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/20 text-teal-400 font-bold text-xs">
                        PM
                      </span>
                      <div>
                        <div className="font-semibold text-white">Payme (Демо-версия)</div>
                        <div className="text-xs text-slate-400">Мгновенный чек и подтверждение</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300">
                      {formatUzs(booking.price)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-900/80 p-4 rounded-xl border border-white/5">
                    <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-white p-2">
                      <QrCode className="h-20 w-20 text-teal-900" />
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="font-semibold text-white">Оплата через Payme:</p>
                      <p>1. Отсканируйте QR-код в приложении Payme</p>
                      <p>2. Сумма к списанию: {formatUzs(booking.price)}</p>
                      <p>3. Нажмите кнопку ниже для подтверждения и получения чека</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDemoPayment("payme")}
                    disabled={loading}
                    className="btn-primary w-full !from-teal-400 !to-emerald-500 text-sm font-bold py-3.5 shadow-lg shadow-teal-500/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Формирование электронного чека...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Я оплатил через Payme (Получить чек)
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 3: Stripe (РЕАЛЬНАЯ СЕССИЯ) */}
              {activeTab === "stripe" && (
                <div className="mt-6 space-y-4 rounded-2xl border border-indigo-400/20 bg-indigo-950/20 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-indigo-400" />
                      <div>
                        <div className="font-semibold text-white">Stripe Checkout (Реальная сессия)</div>
                        <div className="text-xs text-slate-400">Visa, Mastercard, Apple Pay, Google Pay</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
                      {formatUzs(booking.price)}
                    </span>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-slate-900/90 p-4 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-white text-sm">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Официальный защищённый шлюз Stripe
                    </div>
                    <p>
                      Вы будете перенаправлены на официальную страницу оплаты Stripe Checkout. Сумма списывается в сумах (UZS) с вашей карты.
                    </p>
                    <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400">
                      <span>• 256-битное шифрование</span>
                      <span>• 3D Secure</span>
                      <span>• Мгновенное открытие доступа</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleStripeRealCheckout}
                    disabled={loading}
                    className="btn-primary w-full !from-indigo-500 !to-purple-600 text-sm font-bold py-3.5 shadow-lg shadow-indigo-500/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Подключение к Stripe Checkout...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Оплатить через Stripe ({formatUzs(booking.price)})
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
