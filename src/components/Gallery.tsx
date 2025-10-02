"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type Item = { id: number; src: string; alt: string };

const defaultItems: Item[] = [
  { id: 1, src: "/gallery/work1.jpg", alt: "Ремонт компьютера" },
  { id: 2, src: "/gallery/work2.jpg", alt: "Настройка ноутбука" },
  { id: 3, src: "/gallery/work3.jpg", alt: "Установка Windows" },
  { id: 4, src: "/gallery/work4.jpg", alt: "Чистка от пыли" },
  { id: 5, src: "/gallery/work5.jpg", alt: "Замена комплектующих" },
  { id: 6, src: "/gallery/work6.jpg", alt: "Диагностика" },
];

export default function Gallery() {
  const [items] = useState<Item[]>(defaultItems);

  useEffect(() => {
  }, []);

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4 animate-fade-in-up">
          Галерея работ
        </h2>
        <p className="text-slate-300 text-lg animate-fade-in-up delay-200">
          Примеры наших работ и решений
        </p>
      </div>
      
      <div className="card p-4 animate-fade-in-up delay-400">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          spaceBetween={16}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {items.map((it, index) => (
            <SwiperSlide key={it.id}>
              <div 
                className="h-48 sm:h-56 md:h-64 relative bg-[#0b111a] border border-slate-800 rounded-lg overflow-hidden group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Image 
                  src={it.src} 
                  alt={it.alt} 
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}


