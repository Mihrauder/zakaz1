"use client";

import { openApplicationModal } from "@/components/forms/ApplicationForm";

export default function Hero() {
  return (
    <section className="container-px pt-16 sm:pt-20 lg:pt-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="mx-auto max-w-5xl text-center relative">
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white animate-fade-in-up">
          Ремонт и настройка ПК/ноутбуков на дому
        </h1>
        <p className="mt-4 text-slate-300 text-base sm:text-lg animate-fade-in-up delay-200">
          Выезд в день обращения. Диагностика бесплатно при ремонте. Гарантия на работы.
        </p>
        
        {/* Features */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up delay-400">
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Выезд в день обращения</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Диагностика бесплатно</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-300">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Гарантия на работы</span>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-3 animate-fade-in-up delay-600">
          <button 
            onClick={openApplicationModal}
            className="btn-primary px-6 py-3 text-sm sm:text-base hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
          >
            Оставить заявку
          </button>
          <button 
            onClick={() => {
              document.getElementById('reviews')?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }}
            className="btn-outline px-6 py-3 text-sm sm:text-base hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-slate-500/25"
          >
            Отзывы
          </button>
        </div>
      </div>
    </section>
  );
}


