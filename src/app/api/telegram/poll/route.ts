import { NextResponse } from "next/server";
import { store } from "@/server/store";
import { answerCallbackQuery, sendTelegramMessage, inlineKeyboard } from "@/utils/telegram";

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ 
      error: "No bot token", 
      message: "Please set TELEGRAM_BOT_TOKEN in .env.local file. See SETUP.md for instructions." 
    }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-1&limit=1`);
    const data = await res.json();
    
    if (!data.ok || !data.result || data.result.length === 0) {
      return NextResponse.json({ message: "No updates" });
    }

    const update = data.result[0];
    console.log("[TG Poll] Processing update:", JSON.stringify(update, null, 2));

    if (update.callback_query) {
      const cq = update.callback_query;
      const data: string = cq.data || "";
      const fromId: string = String(cq.from?.id || "");
      console.log("[TG Poll] Callback query:", { data, fromId });
      await answerCallbackQuery(cq.id, "Ок");

      if (data.startsWith("app_accept:")) {
        const appId = data.split(":")[1];
        store.setState(fromId, { kind: "await_accept_details", appId });
        await sendTelegramMessage({ chatId: String(fromId), text: `Введите адрес и описание для заявки #${appId} в одном сообщении.` });
        return NextResponse.json({ ok: true, action: "app_accept", appId });
      }
      if (data.startsWith("app_decline:")) {
        const appId = data.split(":")[1];
        store.setState(fromId, { kind: "await_decline_note", appId });
        await sendTelegramMessage({ chatId: String(fromId), text: `Укажите причину отказа для заявки #${appId}.` });
        return NextResponse.json({ ok: true, action: "app_decline", appId });
      }
      if (data.startsWith("app_done:")) {
        const appId = data.split(":")[1];
        store.setState(fromId, { kind: "await_done", appId });
        await sendTelegramMessage({ chatId: String(fromId), text: `Введите сумму и примечание для заявки #${appId}.` });
        return NextResponse.json({ ok: true, action: "app_done", appId });
      }
      if (data.startsWith("review_approve:")) {
        const id = data.split(":")[1];
        const review = store.reviews.find(r => r.id === id);
        if (review) review.approved = true;
        await sendTelegramMessage({ chatId: String(fromId), text: `Отзыв #${id} разрешён.` });
        return NextResponse.json({ ok: true, action: "review_approve", reviewId: id });
      }
      if (data.startsWith("review_reject:")) {
        const id = data.split(":")[1];
        const idx = store.reviews.findIndex(r => r.id === id);
        if (idx >= 0) store.reviews.splice(idx, 1);
        await sendTelegramMessage({ chatId: String(fromId), text: `Отзыв #${id} удалён.` });
        return NextResponse.json({ ok: true, action: "review_reject", reviewId: id });
      }
    }

    if (update.message) {
      const msg = update.message;
      const userId: string = String(msg.from?.id || "");
      const state = store.getOrIdle(userId);
      const text: string = msg.text || "";

      if (state.kind === "await_decline_note") {
        const app = store.applications.find(a => a.id === state.appId);
        if (app) {
          app.status = "Отказ";
          app.note = text;
        }
        store.clearState(userId);
        await sendTelegramMessage({ chatId: process.env.TELEGRAM_CHAT_ID || "", text: `Заявка #${state.appId}: статус "Отказ". Примечание: ${text}` });
        return NextResponse.json({ ok: true, action: "decline_note", appId: state.appId });
      }

      if (state.kind === "await_accept_details") {
        const app = store.applications.find(a => a.id === state.appId);
        if (app) {
          app.status = "Выполняется";
          app.address = text;
        }
        store.clearState(userId);
        const buttons = inlineKeyboard([[{ text: "Выполнено", callback_data: `app_done:${state.appId}` }]]);
        await sendTelegramMessage({ chatId: process.env.TELEGRAM_CHAT_ID || "", text: `Заявка #${state.appId}: статус "Выполняется". Детали: ${text}`, replyMarkup: buttons });
        return NextResponse.json({ ok: true, action: "accept_details", appId: state.appId });
      }

      if (state.kind === "await_done") {
        const app = store.applications.find(a => a.id === state.appId);
        if (app) {
          const match = text.match(/(\d+[\.,]?\d*)/);
          app.status = "Выполнено";
          app.cost = match ? Number(match[1].replace(",", ".")) : undefined;
          app.note = text;
        }
        store.clearState(userId);
        await sendTelegramMessage({ chatId: process.env.TELEGRAM_CHAT_ID || "", text: `Заявка #${state.appId}: статус "Выполнено". ${text}` });
        return NextResponse.json({ ok: true, action: "done", appId: state.appId });
      }
    }

    return NextResponse.json({ message: "Update processed" });
  } catch (error) {
    console.error("[TG Poll] Error:", error);
    return NextResponse.json({ error: "Failed to process update" }, { status: 500 });
  }
}
