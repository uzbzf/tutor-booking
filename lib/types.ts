export type BookingStatus = "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid";
export type PaymentMethod = "click" | "payme" | "stripe" | "cash";
export type OrderType = "lesson" | "course";

export interface Booking {
  id: string;
  type?: OrderType; // "lesson" | "course"
  studentName: string;
  phone: string;
  email: string;
  serviceId: string;
  service: string;
  price: number; // in UZS
  duration: number; // in minutes (0 for full online courses)
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  notes: string;
  createdAt: string;
}

export interface Service {
  id: string;
  title: string;
  duration: number;
  price: number; // in UZS
  description: string;
}

export interface Course {
  id: string;
  title: string;
  badge: string;
  duration: string;
  lessonsCount: number;
  price: number; // in UZS
  oldPrice?: number;
  description: string;
  features: string[];
  level: string;
}

export const SERVICES: Service[] = [
  {
    id: "lesson",
    title: "Индивидуальный урок",
    duration: 60,
    price: 250000,
    description: "Разбор темы, теория и практика, персональное домашнее задание.",
  },
  {
    id: "express",
    title: "Экспресс-консультация",
    duration: 30,
    price: 150000,
    description: "Быстрый разбор сложной задачи или план подготовки к экзаменам.",
  },
  {
    id: "mock",
    title: "Разбор пробника",
    duration: 90,
    price: 350000,
    description: "Подробный разбор пробного варианта по критериям оценивания.",
  },
];

export const COURSES: Course[] = [
  {
    id: "course-math-pro",
    title: "Полный курс: Профильная математика",
    badge: "Хит года",
    duration: "3 месяца",
    lessonsCount: 24,
    price: 1800000,
    oldPrice: 2200000,
    description: "Комплексная программа с нуля до 90+ баллов: параметры, геометрия, экономика и теория чисел.",
    features: [
      "24 онлайн-урока с живыми разборами",
      "Доступ к интерактивной платформе 24/7",
      "Проверка домашних заданий куратором",
      "Закрытый Telegram-чат с репетитором",
      "3 полных пробных экзамена с анализом",
    ],
    level: "9-11 классы",
  },
  {
    id: "course-higher-math",
    title: "Высшая математика для студентов",
    badge: "Сессия на отлично",
    duration: "2 месяца",
    lessonsCount: 16,
    price: 1400000,
    oldPrice: 1700000,
    description: "Мат. анализ, линейная алгебра, кратные интегралы и дифуравнения понятным языком.",
    features: [
      "16 тематических видеолекций и семинаров",
      "Разбор типовых билетов и контрольных",
      "Шпаргалки и конспекты ко всем темам",
      "Индивидуальный разбор вопросов перед зачетом",
    ],
    level: "1-2 курсы ВУЗов",
  },
  {
    id: "course-olympiad-physics",
    title: "Олимпиадная физика: От базы к победам",
    badge: "Премиум",
    duration: "4 месяца",
    lessonsCount: 32,
    price: 2400000,
    oldPrice: 2900000,
    description: "Глубокая физика для побед в олимпиадах: нестандартные методы механики, оптики и электродинамики.",
    features: [
      "32 интенсивных семинара",
      "Разбор задач Всероссийской олимпиады и ДВИ",
      "Методички олимпиадных приёмов решений",
      "Персональный менторинг автора курса",
    ],
    level: "8-11 классы",
  },
];

export const TIME_SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Подтверждено",
  cancelled: "Отменено",
  completed: "Проведено",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, { name: string; color: string }> = {
  click: { name: "Click", color: "from-cyan-500 to-blue-600" },
  payme: { name: "Payme", color: "from-teal-400 to-emerald-500" },
  stripe: { name: "Stripe", color: "from-indigo-500 to-purple-600" },
  cash: { name: "При встрече", color: "from-slate-600 to-slate-700" },
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { name: string; style: string }> = {
  paid: { name: "Оплачено", style: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  pending: { name: "Ожидает оплаты", style: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
};

export function formatUzs(amount: number): string {
  return amount.toLocaleString("ru-RU") + " UZS";
}

export const ADMIN_PIN = "1234";
