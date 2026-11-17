"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, GraduationCap, LayoutDashboard, User } from "lucide-react";

export default function Navbar() {
  const path = usePathname();
  const admin = path.startsWith("/admin");

  const tab = (active: boolean) =>
    `flex items-center gap-1.5 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition ${
      active
        ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow"
        : "text-slate-400 hover:text-white"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-white shadow-md shadow-indigo-500/25">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-white sm:text-base">
              TutorBook
            </span>
            <span className="text-[10px] text-cyan-400 font-semibold -mt-1 hidden sm:block">
              UZS • Click • Payme • Stripe
            </span>
          </div>
        </Link>

        {/* Section Links for Client */}
        {!admin && (
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#courses" className="hover:text-indigo-300 transition flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-indigo-400" /> Курсы
            </a>
            <a href="#booking" className="hover:text-indigo-300 transition flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Запись на урок
            </a>
          </nav>
        )}

        <nav className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          <Link href="/" className={tab(!admin)}>
            <User className="h-4 w-4" /> <span className="hidden sm:inline">Клиент</span>
          </Link>
          <Link href="/admin" className={tab(admin)}>
            <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Админка</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
