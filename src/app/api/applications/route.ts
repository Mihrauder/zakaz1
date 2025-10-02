import { NextRequest, NextResponse } from "next/server";
import { store } from "@/server/store";
import { inlineKeyboard } from "@/utils/telegram";
import { appendApplicationRow, type SheetRow } from "@/utils/sheets";
import { requireServerEnv } from "@/utils/env";


export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name = "", phone = "", address = "", description = "", turnstileToken = "" } = body as {
    name?: string;
    phone?: string;
    address?: string;
    description?: string;
    turnstileToken?: string;
  };

  try {
    const secretKey = requireServerEnv("TURNSTILE_SECRET_KEY");
    if (!turnstileToken) {
      return NextResponse.json({ error: "captcha_required" }, { status: 400 });
    }
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: turnstileToken,
        ...(ip ? { remoteip: ip } : {}),
      }),
      cache: "no-store",
    });
    const data = (await verifyRes.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) {
      return NextResponse.json({ error: "bad_captcha", details: data["error-codes"] || [] }, { status: 400 });
    }
  } catch (e) {
    console.log("[Turnstile] verification error", e);
    return NextResponse.json({ error: "captcha_verify_failed" }, { status: 400 });
  }

  const phoneRegex = /^\+7\(\d{3}\) \d{3}-\d{2}-\d{2}$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json({ error: "bad_phone" }, { status: 400 });
  }

  let isRepeat = false;
  try {
    const { checkDuplicatePhoneInSheets } = await import("@/utils/sheets");
    isRepeat = await checkDuplicatePhoneInSheets(phone);
  } catch (e) {
    console.log("[Applications] Failed to check duplicates in sheets:", e);
  }

  let appId = "0001";
  try {
    const { getNextApplicationNumber } = await import("@/utils/sheets");
    const nextNumber = await getNextApplicationNumber();
    appId = nextNumber.toString().padStart(4, "0");
  } catch (e) {
    console.log("[Applications] Failed to get next number from sheets:", e);
  }

  const createdAt = new Date().toISOString();
  const status = isRepeat ? "Повторный" : "Новая";
  const repeatLabel = isRepeat ? "Повторный" : "Новый";

  try {
    const row: SheetRow = [
      `#${appId}`,
      new Date(createdAt).toLocaleString("ru-RU"),
      name,
      `'${phone}`,
      address || "",
      status,
      description || "",
      "",
      "",
      repeatLabel,
    ];
    const sheetRow = await appendApplicationRow(row);
    console.log("[Applications] Added to sheets, row:", sheetRow);
  } catch (e) {
    console.log("[Sheets] append failed", e);
  }

  try {

    const text = [
      `<b>${status === "Повторный" ? "Повторная заявка" : "Новая заявка"} #${appId}</b>`,
      `Дата: ${new Date(createdAt).toLocaleString("ru-RU")}`,
      `Заказчик: ${name}`,
      `Телефон: ${phone}`,
      address ? `Адрес: ${address}` : undefined,
      description ? `Описание: ${description}` : undefined,
      `Статус: ${status}`,
    ].filter(Boolean).join("\n");
    const { sendTelegramMessage } = await import("@/utils/telegram");
    const buttons = inlineKeyboard([
      [
        { text: "Принять", callback_data: `app_accept:${appId}` },
        { text: "Отказаться", callback_data: `app_decline:${appId}` },
      ],
    ]);
    await sendTelegramMessage({ chatId: "", text, replyMarkup: buttons });
  } catch (err) {
    console.log("[TG] send skipped/failed", err);
  }

  return NextResponse.json({ ok: true, id: appId });
}

export async function GET() {
  return NextResponse.json({ items: store.applications });
}


