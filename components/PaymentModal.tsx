"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, QrCode, ShieldCheck, Sparkles, X } from "lucide-react";
import { Booking, PaymentMethod, formatUzs } from "@/lib/types";
import { getClickPaymentUrl, getPaymePaymentUrl } from "@/lib/payments";

interface PaymentModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBooking: Booking) => void;
}

export default function PaymentModal({ booking, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<"click" | "payme" | "stripe">(
    (booking.paymentMethod === "cash" ? "click" : booking.paymentMethod) as "click" | "payme" | "stripe"
  );
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    number: "4242 •••• •••• 4242",
    expiry: "12/28",
    cvc: "888",
    name: booking.studentName || "STUDENT NAME",
  });
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const clickUrl = getClickPaymentUrl({
    amount: booking.price,
    orderId: booking.id,
  });

  const paymeUrl = getPaymePaymentUrl({
    amount: booking.price,
    orderId: booking.id,
  });

  async function handleConfirmPayment(method: PaymentMethod) {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          paymentMethod: method,
          paymentId: `${method}_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.booking) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(data.booking);
          onClose();
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStripeCheckout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();

      if (data.mode === "live" && data.url) {
        window.location.href = data.url;
        return;
      }

      // Демо-режим Stripe
      await handleConfirmPayment("stripe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="glass relative w-full max-w-xl overflow-hidden bg-slate-950/95 p-6 sm:p-8"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Безопасный платёж
                </span>
                <span className="text-xs text-slate-400">Заказ #{booking.id}</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold">{booking.service}</h2>
              <p className="mt-1 text-xl font-extrabold text-indigo-400">
                {formatUzs(booking.price)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {success ? (
            <div className="py-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/20 text-emerald-400"
              >
                <CheckCircle2 className="h-12 w-12" />
              </motion.div>
              <h3 className="mt-4 text-2xl font-bold">Оплата подтверждена!</h3>
              <p className="mt-2 text-sm text-slate-400">
                Средства зачислены, статус заказа успешно обновлён.
              </p>
            </div>
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

              {/* Tab Content */}
              <div className="mt-6">
                {activeTab === "click" && (
                  <div className="space-y-4 rounded-2xl border border-cyan-400/20 bg-cyan-950/20 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs">
                          UZ
                        </span>
                        <div>
                          <div className="font-semibold text-white">Оплата через Click Up</div>
                          <div className="text-xs text-slate-400">Комиссия 0%</div>
                        </div>
                      </div>
                      <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-300">
                        {formatUzs(booking.price)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center bg-slate-900/80 p-4 rounded-xl border border-white/5">
                      <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-white p-2">
                        {/* QR Code SVG Placeholder */}
                        <QrCode className="h-20 w-20 text-slate-900" />
                      </div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <p className="font-semibold text-slate-100">Сканируйте в приложении Click:</p>
                        <p>1. Откройте приложение Click Up</p>
                        <p>2. Нажмите «Сканировать QR»</p>
                        <p>3. Либо нажмите кнопку «Оплатить на сайте Click»</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <a
                        href={clickUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex-1 !from-cyan-500 !to-blue-600 text-sm"
                      >
                        <ExternalLink className="h-4 w-4" /> Перейти в Click.uz
                      </a>
                      <button
                        onClick={() => handleConfirmPayment("click")}
                        disabled={loading}
                        className="btn-ghost flex-1 text-sm border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/10"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Я оплатил (Проверить)
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "payme" && (
                  <div className="space-y-4 rounded-2xl border border-teal-400/20 bg-teal-950/20 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-500/20 text-teal-400 font-bold text-xs">
                          PM
                        </span>
                        <div>
                          <div className="font-semibold text-white">Оплата через Payme</div>
                          <div className="text-xs text-slate-400">Мгновенное зачисление</div>
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
                        <p className="font-semibold text-slate-100">Оплата через Payme:</p>
                        <p>1. Откройте приложение Payme</p>
                        <p>2. Сканируйте QR или перейдите по защищенной ссылке</p>
                        <p>3. Подтвердите списание с Uzcard или Humo</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <a
                        href={paymeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex-1 !from-teal-400 !to-emerald-500 text-sm"
                      >
                        <ExternalLink className="h-4 w-4" /> Перейти в Payme
                      </a>
                      <button
                        onClick={() => handleConfirmPayment("payme")}
                        disabled={loading}
                        className="btn-ghost flex-1 text-sm border-teal-400/30 text-teal-300 hover:bg-teal-500/10"
                      >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Я оплатил (Проверить)
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "stripe" && (
                  <div className="space-y-4 rounded-2xl border border-indigo-400/20 bg-indigo-950/20 p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-indigo-400" />
                        <div>
                          <div className="font-semibold text-white">Международная карта (Stripe)</div>
                          <div className="text-xs text-slate-400">Visa, Mastercard, Amex, Apple Pay</div>
                        </div>
                      </div>
                      <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
                        {formatUzs(booking.price)}
                      </span>
                    </div>

                    {/* Styled Card Form */}
                    <div className="rounded-xl border border-white/10 bg-slate-900/90 p-4 space-y-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Номер банковской карты</label>
                        <input
                          type="text"
                          className="input font-mono text-sm tracking-wider"
                          value={cardData.number}
                          onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                          placeholder="4242 4242 4242 4242"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Срок (ММ/ГГ)</label>
                          <input
                            type="text"
                            className="input font-mono text-sm"
                            value={cardData.expiry}
                            onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                            placeholder="12/28"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">CVC / CVP</label>
                          <input
                            type="password"
                            maxLength={4}
                            className="input font-mono text-sm"
                            value={cardData.cvc}
                            onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                            placeholder="•••"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Имя держателя карты</label>
                        <input
                          type="text"
                          className="input text-sm uppercase"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          placeholder="IVAN IVANOV"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Платёж защищён 256-битным шифрованием Stripe
                    </div>

                    <button
                      onClick={handleStripeCheckout}
                      disabled={loading}
                      className="btn-primary w-full !from-indigo-500 !to-purple-600 text-sm"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Обработка платежа...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Оплатить картой {formatUzs(booking.price)}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
