import { PaymentMethod } from "./types";

// Конфигурация мерчантов (при наличии берутся из env, иначе используются безопасные демо-идентификаторы)
export const PAYMENT_CONFIG = {
  click: {
    serviceId: process.env.CLICK_SERVICE_ID || "32512",
    merchantId: process.env.CLICK_MERCHANT_ID || "18439",
    merchantUserId: process.env.CLICK_MERCHANT_USER_ID || "24510",
  },
  payme: {
    merchantId: process.env.PAYME_MERCHANT_ID || "65123abcdfe124567890abcd",
  },
  stripe: {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
    secretKey: process.env.STRIPE_SECRET_KEY || "",
  },
};

/**
 * Создание ссылки на оплату через Click (click.uz)
 * Документация Click Up: https://docs.click.uz
 */
export function getClickPaymentUrl(params: {
  amount: number; // в сумах
  orderId: string;
  returnUrl?: string;
}): string {
  const { amount, orderId, returnUrl = "" } = params;
  const baseUrl = "https://my.click.uz/services/pay";
  const search = new URLSearchParams({
    service_id: PAYMENT_CONFIG.click.serviceId,
    merchant_id: PAYMENT_CONFIG.click.merchantId,
    amount: String(amount),
    transaction_param: orderId,
  });
  if (returnUrl) {
    search.set("return_url", returnUrl);
  }
  return `${baseUrl}?${search.toString()}`;
}

/**
 * Создание ссылки на оплату через Payme (payme.uz)
 * Формат ссылки: base64(m=merchant_id;ac.order_id=order_id;a=amount_tiyin)
 */
export function getPaymePaymentUrl(params: {
  amount: number; // в сумах
  orderId: string;
}): string {
  const { amount, orderId } = params;
  // В Payme сумма передается в тийинах (1 сум = 100 тийин)
  const amountTiyin = amount * 100;
  const rawData = `m=${PAYMENT_CONFIG.payme.merchantId};ac.order_id=${orderId};a=${amountTiyin}`;
  
  // Base64 кодирование
  const base64Data = typeof window !== "undefined" 
    ? btoa(rawData) 
    : Buffer.from(rawData).toString("base64");

  return `https://checkout.paycom.uz/${base64Data}`;
}

/**
 * Описание способов оплаты для интерфейса
 */
export const PAYMENT_PROVIDERS: Record<
  Exclude<PaymentMethod, "cash">,
  {
    id: Exclude<PaymentMethod, "cash">;
    name: string;
    subtitle: string;
    badge: string;
    iconText: string;
    gradient: string;
    borderActive: string;
  }
> = {
  click: {
    id: "click",
    name: "Click",
    subtitle: "Uzcard / Humo / Click Up",
    badge: "0% комиссия",
    iconText: "CLICK",
    gradient: "from-cyan-500/20 to-blue-600/20",
    borderActive: "border-cyan-400 bg-cyan-500/10 shadow-cyan-500/20",
  },
  payme: {
    id: "payme",
    name: "Payme",
    subtitle: "Uzcard / Humo / QR-код",
    badge: "Быстрая оплата",
    iconText: "payme",
    gradient: "from-teal-400/20 to-emerald-500/20",
    borderActive: "border-teal-400 bg-teal-500/10 shadow-teal-500/20",
  },
  stripe: {
    id: "stripe",
    name: "Stripe",
    subtitle: "Международные карты Visa / Mastercard",
    badge: "Весь мир",
    iconText: "stripe",
    gradient: "from-indigo-500/20 to-purple-600/20",
    borderActive: "border-indigo-400 bg-indigo-500/10 shadow-indigo-500/20",
  },
};
