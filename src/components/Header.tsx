"use client";

import Link from "next/link";
import Logo from "@/components/Logo";
import { openApplicationModal } from "@/components/forms/ApplicationForm";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-[rgba(11,15,22,0.7)] backdrop-blur">
      <div className="container-px mx-auto flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Logo size="md" />
          <span className="text-white font-semibold tracking-tight text-lg">BAF Service</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-300">
          <button onClick={openApplicationModal} className="hover:text-white transition-colors">Заявка</button>
          <button 
            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="hover:text-white transition-colors"
          >
            Услуги
          </button>
          <button 
            onClick={() => document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="hover:text-white transition-colors"
          >
            Галерея
          </button>
          <button 
            onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="hover:text-white transition-colors"
          >
            Отзывы
          </button>
          <button 
            onClick={() => document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="hover:text-white transition-colors"
          >
            Контакты
          </button>
        </nav>
      </div>
    </header>
  );
}
