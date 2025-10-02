import { assertServerOnly, getOptionalServerEnv, requireServerEnv } from "@/utils/env";

export type TelegramMessage = {
  chatId: string;
  text: string;
  replyMarkup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
};

export async function sendTelegramMessage(message: TelegramMessage) {
  assertServerOnly("telegram");
  const token = requireServerEnv("TELEGRAM_BOT_TOKEN");
  const chatId = message.chatId || getOptionalServerEnv("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    console.log("[TG] Skipped send (no token/chat)", message.text);
    return { ok: false };
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message.text,
      reply_markup: message.replyMarkup,
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  });
  return res.json();
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  assertServerOnly("telegram");
  const token = getOptionalServerEnv("TELEGRAM_BOT_TOKEN");
  if (!token) return { ok: false };
  const url = `https://api.telegram.org/bot${token}/answerCallbackQuery`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
  return res.json();
}

export type InlineKeyboardButton = { text: string; callback_data: string };
export function inlineKeyboard(buttonRows: InlineKeyboardButton[][]) {
  return { inline_keyboard: buttonRows };
}


