"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, BookOpen, Calendar, Sparkles, Star, Trophy, X } from "lucide-react";

const SUBJECTS = [
  "Подготовка к ЕГЭ/ОГЭ, DTM и вступительным по математике",
  "Высшая математика и мат. анализ для студентов",
  "Олимпиадная физика (городской и республиканский уровни)",
];
const REGALIA = [
  "МГУ им. Ломоносова",
  "Эксперт вступительных экзаменов",
  "8+ лет опыта преподавания",
  "Средний балл учеников 92+",
];
const REVIEWS = [
  {
    name: "Сардор Р.",
    text: "Поступил на грант в филиал МГУ в Ташкенте! Разбирали сложные параметры и геометрию — объяснения кристально понятные.",
    stars: 5,
  },
  {
    name: "Дильноза У.",
    text: "Купила онлайн-курс по высшей математике. Сдала сессию на отлично без нервов. Очень крутой формат!",
    stars: 5,
  },
  {
    name: "Малика А.",
    text: "Оплатили через Click в один клик. Преподаватель всегда на связи в Telegram, подробные конспекты ко всем урокам.",
    stars: 5,
  },
];

export default function TutorHero() {
  const [open, setOpen] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass relative overflow-hidden p-6 sm:p-10"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 animate-float rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 animate-float rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center">
        <div className="grid h-28 w-28 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-4xl font-bold shadow-xl shadow-indigo-500/30 text-white">
          АВ
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Александр Воронов
            </h1>
            <span className="rounded-full bg-cyan-500/15 border border-cyan-400/30 px-3 py-0.5 text-xs font-semibold text-cyan-300">
              Онлайн & Узбекистан
            </span>
          </div>

          <p className="mt-1 text-slate-300 font-medium">
            Репетитор по математике и олимпиадной физике
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {REGALIA.map((r) => (
              <span
                key={r}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
              >
                <Award className="h-3.5 w-3.5 text-emerald-400" /> {r}
              </span>
            ))}
          </div>

          <ul className="mt-4 space-y-1.5 text-xs sm:text-sm text-slate-300">
            {SUBJECTS.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-400 shrink-0" /> {s}
              </li>
            ))}
          </ul>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#booking" className="btn-primary !py-2.5 !px-5 text-sm">
              <Calendar className="h-4 w-4" /> Записаться на урок
            </a>
            <a href="#courses" className="btn-ghost !py-2.5 !px-5 text-sm border-indigo-400/30 hover:bg-indigo-500/15 text-indigo-300">
              <Sparkles className="h-4 w-4" /> Выбрать онлайн-курс
            </a>
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="glass flex flex-col items-center px-6 py-4 transition hover:bg-white/10 shrink-0"
        >
          <span className="flex items-center gap-1 text-3xl font-black text-white">
            5.0 <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </span>
          <span className="text-xs text-slate-400">148 отзывов</span>
          <span className="mt-1 text-xs text-indigo-300 font-medium">Читать отзывы</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-lg bg-slate-900/90 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Отзывы учеников</h2>
                <button onClick={() => setOpen(false)} aria-label="Закрыть">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-3">
                {REVIEWS.map((r) => (
                  <div key={r.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <b>{r.name}</b>
                      <span className="flex">
                        {Array.from({ length: r.stars }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{r.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
