export type BookingStatus = "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  studentName: string;
  phone: string;
  email: string;
  serviceId: string;
  service: string;
  price: number;
  duration: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: BookingStatus;
  notes: string;
  createdAt: string;
}

export interface Service {
  id: string;
  title: string;
  duration: number;
  price: number;
  description: string;
}

export const SERVICES: Service[] = [
  {
    id: "lesson",
    title: "Индивидуальный урок",
    duration: 60,
    price: 2500,
    description: "Разбор темы, теория и практика, персональное домашнее задание.",
  },
  {
    id: "express",
    title: "Экспресс-консультация",
    duration: 30,
    price: 1500,
    description: "Быстрый разбор сложной задачи или план подготовки.",
  },
  {
    id: "mock",
    title: "Разбор пробника",
    duration: 90,
    price: 3500,
    description: "Подробный разбор пробного экзамена по критериям ЕГЭ/ОГЭ.",
  },
];

export const TIME_SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00"];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Подтверждено",
  cancelled: "Отменено",
  completed: "Проведено",
};

export const ADMIN_PIN = "1234";
