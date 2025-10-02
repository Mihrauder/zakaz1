"use client";

import { openApplicationModal } from "@/components/forms/ApplicationForm";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-16">
      <div className="container-px py-8 text-sm text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} BAF Service. Все права защищены.</p>
        <div className="flex gap-6">
          <button onClick={openApplicationModal} className="hover:text-white transition-colors">Оставить заявку</button>
          <button 
            onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="hover:text-white transition-colors"
          >
            Отзывы
          </button>
        </div>
      </div>
    </footer>
  );
}
