"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, BookOpen, Star, X } from "lucide-react";

const SUBJECTS = ["Подготовка к ЕГЭ/ОГЭ по математике", "Высшая математика", "Олимпиадная физика"];
const REGALIA = ["МГУ им. Ломоносова", "Эксперт ЕГЭ", "8+ лет опыта", "Средний балл учеников 92"];
const REVIEWS = [
  { name: "Анна П.", text: "С нуля до 94 баллов за полгода. Объясняет так, что всё становится понятно.", stars: 5 },
  { name: "Дмитрий К.", text: "Помог с олимпиадной физикой — вышел в заключительный этап!", stars: 5 },
  { name: "Елена С. (мама)", text: "Сын полюбил математику. Очень структурные занятия и честная обратная связь.", stars: 5 },
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
      <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center">
        <div className="grid h-28 w-28 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-400 text-4xl font-bold shadow-xl shadow-indigo-500/30">
          АВ
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Александр Воронов</h1>
          <p className="mt-1 text-slate-400">Репетитор по математике и физике</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {REGALIA.map((r) => (
              <span key={r} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                <Award className="h-3.5 w-3.5 text-emerald-400" /> {r}
              </span>
            ))}
          </div>
          <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
            {SUBJECTS.map((s) => (
              <li key={s} className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-400" /> {s}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={() => setOpen(true)} className="glass flex flex-col items-center px-6 py-4 transition hover:bg-white/10">
          <span className="flex items-center gap-1 text-3xl font-bold">
            5.0 <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </span>
          <span className="text-xs text-slate-400">148 отзывов</span>
          <span className="mt-1 text-xs text-indigo-300">Читать отзывы</span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-lg bg-slate-900/90 p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">Отзывы учеников</h2>
                <button onClick={() => setOpen(false)} aria-label="Закрыть"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-3">
                {REVIEWS.map((r) => (
                  <div key={r.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <b>{r.name}</b>
                      <span className="flex">{Array.from({ length: r.stars }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</span>
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
