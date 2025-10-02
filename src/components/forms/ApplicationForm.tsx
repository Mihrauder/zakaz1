"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect, useCallback, memo, useRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import Modal from "@/components/Modal";

const phoneRegex = /^\+7\(\d{3}\) \d{3}-\d{2}-\d{2}$/;

const formSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  phone: z.string().regex(phoneRegex, "Формат: +7(999) 555-35-35"),
  address: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const formatPhoneMask = (value: string) => {
  const digits = value.replace(/\D/g, "");
  const part = digits.substring(1);
  let out = "+7";
  if (part.length > 0) out += `(${part.substring(0, 3)}`;
  if (part.length >= 3) out += ") ";
  if (part.length > 3) out += part.substring(3, 6);
  if (part.length >= 6) out += "-";
  if (part.length > 6) out += part.substring(6, 8);
  if (part.length >= 8) out += "-";
  if (part.length > 8) out += part.substring(8, 10);
  return out;
};

let globalModalOpen: (() => void) | null = null;

export function openApplicationModal() {
  if (globalModalOpen) globalModalOpen();
}

function ApplicationForm() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState("+7(");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  
  globalModalOpen = () => setIsModalOpen(true);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#application') {
        setIsModalOpen(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    if (window.location.hash === '#application') {
      setIsModalOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { phone: "+7(" },
  });

  const onPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let value = raw.startsWith("+7") ? raw : "+7" + raw.replace(/^\+7/, "");
    value = formatPhoneMask(value);
    setPhoneValue(value);
    setValue("phone", value, { shouldValidate: true });
  }, [setValue]);

  const onSubmit = useCallback(async (values: FormValues) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!turnstileToken) {
        throw new Error("Подтвердите, что вы не робот");
      }
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          address: values.address ?? "",
          description: values.description ?? "",
          turnstileToken,
        }),
      });
      if (!res.ok) throw new Error("Ошибка при отправке");
      setSuccess("Заявка отправлена. Мы свяжемся с вами.");
      reset({ phone: "+7(", name: "", address: "", description: "" });
      setPhoneValue("+7(");
      setTurnstileToken(null);
      try { turnstileRef.current?.reset(); } catch {}
      setTimeout(() => setIsModalOpen(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }, [reset, turnstileToken]);

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Оставить заявку"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
          <div className="animate-fade-in-up">
            <label className="block text-sm text-slate-300 mb-1">Имя</label>
            <input
              {...register("name")}
              className="w-full rounded-md bg-[#0b111a] border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none px-3 py-2 text-white transition-all duration-300 hover:border-slate-600"
              placeholder="Иван"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400 animate-fade-in">{errors.name.message}</p>}
          </div>
          <div className="animate-fade-in-up delay-100">
            <label className="block text-sm text-slate-300 mb-1">Телефон</label>
            <input
              value={phoneValue}
              onChange={onPhoneChange}
              className="w-full rounded-md bg-[#0b111a] border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none px-3 py-2 text-white transition-all duration-300 hover:border-slate-600"
              placeholder="+7(999) 555-35-35"
              inputMode="numeric"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-400 animate-fade-in">{errors.phone.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in-up delay-200">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Адрес (по желанию)</label>
              <input
                {...register("address")}
                className="w-full rounded-md bg-[#0b111a] border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none px-3 py-2 text-white transition-all duration-300 hover:border-slate-600"
                placeholder="г. Москва, ул. ..."
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Описание (по желанию)</label>
              <input
                {...register("description")}
                className="w-full rounded-md bg-[#0b111a] border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none px-3 py-2 text-white transition-all duration-300 hover:border-slate-600"
                placeholder="Что случилось?"
              />
            </div>
          </div>
          <div className="animate-fade-in-up delay-250">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
              options={{ theme: "dark" }}
            />
          </div>
          {error && <p className="text-red-400 text-sm animate-fade-in">{error}</p>}
          {success && <p className="text-green-400 text-sm animate-fade-in">{success}</p>}
          <div className="flex gap-3 pt-2 animate-fade-in-up delay-300">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 text-slate-300 border border-slate-600 rounded-md hover:bg-slate-800 hover:border-slate-500 transition-all duration-300 hover:scale-[1.02]"
            >
              Отмена
            </button>
            <button 
              type="submit"
              disabled={submitting} 
              className="flex-1 btn-primary px-4 py-2 text-sm disabled:opacity-60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25"
            >
              {submitting ? "Отправка..." : "Отправить"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default memo(ApplicationForm);