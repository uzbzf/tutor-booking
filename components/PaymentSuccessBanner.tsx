"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, X } from "lucide-react";

export default function PaymentSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const oid = searchParams.get("orderId");
    const sessionId = searchParams.get("session_id");

    if (payment === "success" && oid) {
      setOrderId(oid);
      setShow(true);

      // Верифицируем сессию Stripe на сервере
      fetch("/api/checkout/stripe-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: oid, sessionId }),
      }).catch(console.error);

      // Очищаем search params из URL без перезагрузки страницы
      const timer = setTimeout(() => {
        router.replace("/", { scroll: false });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="glass fixed top-20 inset-x-4 max-w-xl mx-auto z-[80] border border-emerald-400/40 bg-slate-950/95 p-4 shadow-2xl rounded-2xl flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-400" /> Оплата через Stripe успешно завершена!
            </div>
            <div className="text-xs text-slate-400">
              Заказ #{orderId} оплачен. Доступ к курсу/занятию активирован.
            </div>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
