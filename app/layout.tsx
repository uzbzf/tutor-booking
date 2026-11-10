import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Александр Воронов — репетитор по математике и физике",
  description: "Онлайн-запись на уроки: ЕГЭ/ОГЭ, высшая математика, олимпиадная физика.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="font-sans">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-24">{children}</main>
      </body>
    </html>
  );
}
