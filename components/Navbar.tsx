"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LayoutDashboard, User } from "lucide-react";

export default function Navbar() {
  const path = usePathname();
  const admin = path.startsWith("/admin");
  const tab = (active: boolean) =>
    `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
      active ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow" : "text-slate-400 hover:text-white"
    }`;
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">TutorBook</span>
        </Link>
        <nav className="flex gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          <Link href="/" className={tab(!admin)}>
            <User className="h-4 w-4" /> Смотреть как клиент
          </Link>
          <Link href="/admin" className={tab(admin)}>
            <LayoutDashboard className="h-4 w-4" /> Перейти в админку
          </Link>
        </nav>
      </div>
    </header>
  );
}
