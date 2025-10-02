"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useEffect, useState } from "react";

type Review = {
  id: string;
  name: string;
  text: string;
};

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetch("/api/reviews?limit=10", { cache: "no-store" }).then(async (r) => {
      if (!r.ok) return;
      const data = await r.json();
      setReviews(data.items ?? []);
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-semibold text-white">Отзывы</h2>
        <a href="#leave-review" className="text-sm text-slate-300 hover:text-white transition-colors">Оставить отзыв</a>
      </div>
      <div className="card p-4">
        {reviews.length === 0 ? (
          <p className="text-slate-400 text-sm">Отзывов пока нет.</p>
        ) : (
          <Swiper
            modules={[Pagination, Autoplay]}
            slidesPerView={1}
            spaceBetween={16}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
          >
            {reviews.map((r) => (
              <SwiperSlide key={r.id}>
                <article className="bg-[#0b111a] border border-slate-800 rounded-lg p-4 h-full">
                  <h3 className="text-white font-medium">{r.name}</h3>
                  <p className="text-slate-300 text-sm mt-2">{r.text}</p>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
      <ReviewForm />
    </div>
  );
}

function ReviewForm() {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  async function submit() {
    setSent(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, text }),
    });
    if (res.ok) {
      setSent("Отправлено на модерацию");
      setName("");
      setText("");
    } else {
      setSent("Ошибка отправки");
    }
  }

  return (
    <div id="leave-review" className="mt-6 card p-4">
      <h3 className="text-white font-medium">Оставить отзыв</h3>
      <div className="mt-3 grid grid-cols-1 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
          className="w-full rounded-md bg-[#0b111a] border border-slate-700 focus:border-slate-500 outline-none px-3 py-2 text-white"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ваш отзыв"
          className="w-full min-h-24 rounded-md bg-[#0b111a] border border-slate-700 focus:border-slate-500 outline-none px-3 py-2 text-white"
        />
        <button onClick={submit} className="btn-primary px-5 py-2 text-sm w-max">Отправить</button>
        {sent && <p className="text-slate-400 text-sm">{sent}</p>}
      </div>
    </div>
  );
}


