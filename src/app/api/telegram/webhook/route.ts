import { NextRequest, NextResponse } from "next/server";
import { store, reviewsDb } from "@/server/store";
import { answerCallbackQuery, sendTelegramMessage, inlineKeyboard } from "@/utils/telegram";
import { type SheetRow } from "@/utils/sheets";

export async function POST(req: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[TG Webhook] No bot token found");
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  let update;
  try {
    const body = await req.text();
    if (!body || body.trim() === '') {
      console.log("[TG Webhook] Empty body received");
      return NextResponse.json({ ok: true });
    }
    update = JSON.parse(body);
  } catch (error) {
    console.log("[TG Webhook] Failed to parse JSON:", error);
    return NextResponse.json({ ok: true });
  }
  
  console.log("[TG Webhook] Received update:", JSON.stringify(update, null, 2));
  
  if (update.callback_query) {
    const cq = update.callback_query;
    const data: string = cq.data || "";
    const fromId: string = String(cq.from?.id || "");
    console.log("[TG Webhook] Callback query:", { data, fromId });
    await answerCallbackQuery(cq.id, "Ок");

    if (data.startsWith("app_accept:")) {
      const appId = data.split(":")[1];
      store.setState(fromId, { kind: "await_accept_details", appId });
      await sendTelegramMessage({ chatId: String(fromId), text: `Введите адрес и описание для заявки #${appId} в одном сообщении.` });
      return NextResponse.json({ ok: true });
    }
    if (data.startsWith("app_decline:")) {
      const appId = data.split(":")[1];
      const deleted = store.deleteApplicationById(appId);
      if (deleted) {
        await sendTelegramMessage({ chatId: String(fromId), text: `Заявка #${appId} удалена. Нумерация обновлена.` });
      } else {
        await sendTelegramMessage({ chatId: String(fromId), text: `Заявка #${appId} не найдена.` });
      }
      return NextResponse.json({ ok: true });
    }
    if (data.startsWith("app_done:")) {
      const appId = data.split(":")[1];
      console.log("[TG Webhook] Setting await_done state for appId:", appId, "fromId:", fromId);
      store.setState(fromId, { kind: "await_done", appId });
      await sendTelegramMessage({ chatId: String(fromId), text: `Введите сумму и примечание для заявки #${appId}. Пример: 4000 Описание работы` });
      return NextResponse.json({ ok: true });
    }
    if (data.startsWith("review_approve:")) {
      const id = data.split(":")[1];
      store.approveReview(id);
      reviewsDb.approve(id);
      await sendTelegramMessage({ chatId: String(fromId), text: `Отзыв #${id} разрешён.` });
      return NextResponse.json({ ok: true });
    }
    if (data.startsWith("review_reject:")) {
      const id = data.split(":")[1];
      store.deleteReview(id);
      reviewsDb.delete(id);
      await sendTelegramMessage({ chatId: String(fromId), text: `Отзыв #${id} удалён.` });
      return NextResponse.json({ ok: true });
    }

    if (data.startsWith("review_delete:")) {
      const id = data.split(":")[1];
      store.deleteReview(id);
      await sendTelegramMessage({ chatId: String(fromId), text: `Отзыв #${id} удалён.` });
      return NextResponse.json({ ok: true });
    }
  }

  if (update.message) {
    const msg = update.message;
    const userId: string = String(msg.from?.id || "");
    const chatId: string = String(msg.chat?.id || userId);
    const state = store.getOrIdle(userId);
    const text: string = msg.text || "";

    let cmd = "";
    let args = "";
    try {
      type Entity = { type: string; offset: number; length: number };
      const entities = Array.isArray(msg.entities) ? (msg.entities as Entity[]) : [];
      const first = entities.find((e: Entity) => e && e.type === "bot_command");
      if (first && typeof first.offset === "number" && typeof first.length === "number") {
        cmd = text.substring(first.offset, first.offset + first.length);
        args = text.substring(first.offset + first.length).trim();
      } else if (text.trim().startsWith("/")) {
        const spaceIdx = text.indexOf(" ");
        cmd = (spaceIdx === -1 ? text : text.substring(0, spaceIdx)).trim();
        args = (spaceIdx === -1 ? "" : text.substring(spaceIdx + 1)).trim();
      }
      if (cmd) {
        cmd = cmd.replace(/@[A-Za-z0-9_]+$/, "").toLowerCase();
      }
    } catch {}

    if (cmd.startsWith("/")) {
      if (cmd === "/start") {
        const helpText = `*Доступные команды:*

/reviews [page] - Одобренные отзывы (по 10 на страницу)
/reviews_all [page] - Все отзывы (по 10 на страницу)
/delete_review_id <id> - Удалить отзыв по ID
/debug_reviews - Диагностика хранилища отзывов
/resequence - Переназначить номера заявок (0001, 0002, 0003...)
/help - Показать эту справку

*Управление заявками:*
Заявки приходят автоматически с кнопками для принятия/отклонения.`;
        try { await sendTelegramMessage({ chatId, text: helpText }); } catch (e) { console.log('[TG send]/start error', e); }
        return NextResponse.json({ ok: true });
      }
      if (cmd === "/reviews") {
        const parts = (args ? ["/reviews", args] : ["/reviews"]).concat();
        const page = Math.max(1, parseInt(parts[1] || "1")) || 1;
        const pageSize = 10;
        const approved = reviewsDb.listApproved(pageSize * page).slice((page-1)*pageSize, page*pageSize);
        const total = approved.length;
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        const start = (page - 1) * pageSize;
        const slice = approved.slice(start, start + pageSize);

        if (slice.length === 0) {
          try { await sendTelegramMessage({ chatId, text: "Нет одобренных отзывов." }); } catch (e) { console.log('[TG send]/reviews empty', e); }
        } else {
          let message = `*Отзывы (страница ${page}/${pageCount})*\n\n`;
          slice.forEach((review, index) => {
            const num = start + index + 1;
            const preview = review.text.length > 120 ? review.text.slice(0, 117) + "…" : review.text;
            message += `${num}. #${review.id} — *${review.name}*\n${preview}\n\n`;
          });
          message += `Удаление: /delete_review_id <id>\nСписок всех: /reviews_all`;
          try { await sendTelegramMessage({ chatId, text: message }); } catch (e) { console.log('[TG send]/reviews list', e); }
        }
        return NextResponse.json({ ok: true });
      }

      if (cmd === "/reviews_all") {
        const parts = (args ? ["/reviews_all", args] : ["/reviews_all"]).concat();
        const page = Math.max(1, parseInt(parts[1] || "1")) || 1;
        const pageSize = 10;
        const all = reviewsDb.listAll();
        const total = all.length;
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        const start = (page - 1) * pageSize;
        const slice = all.slice(start, start + pageSize);

        if (slice.length === 0) {
          try { await sendTelegramMessage({ chatId, text: "Нет отзывов." }); } catch (e) { console.log('[TG send]/reviews_all empty', e); }
        } else {
          let message = `*Все отзывы (страница ${page}/${pageCount})*\n\n`;
          slice.forEach((review, index) => {
            const num = start + index + 1;
            const status = review.approved ? "✅" : "⏳";
            const preview = review.text.length > 120 ? review.text.slice(0, 117) + "…" : review.text;
            message += `${num}. ${status} #${review.id} — *${review.name}*\n${preview}\n\n`;
          });
          message += `Удаление: /delete_review_id <id>`;
          try { await sendTelegramMessage({ chatId, text: message }); } catch (e) { console.log('[TG send]/reviews_all list', e); }
        }
        return NextResponse.json({ ok: true });
      }

      if (cmd === "/delete_review_id") {
        let raw = (args || "").split(/\s+/)[0] || "";
        const before = raw;
        raw = raw.replace(/[\u200B-\u200D\uFEFF]/g, "").trim().replace(/^#+/, "").replace(/^[^A-Za-z0-9_\-]+/, "").toLowerCase();
        const id = raw;
        console.log("[TG Webhook] delete_review_id parsed:", { before, id });
        if (!id) {
          try { await sendTelegramMessage({ chatId, text: "Укажите ID: /delete_review_id <id>" }); } catch (e) { console.log('[TG send]/delete_review_id missing id', e); }
          return NextResponse.json({ ok: true });
        }
        let ok = store.deleteReview(id) || reviewsDb.delete(id);
        if (!ok) {
          try {
            const all = reviewsDb.listAll();
            const hit = all.find(r => (r.id || "").toLowerCase() === id);
            if (hit) {
              ok = store.deleteReview(hit.id) || reviewsDb.delete(hit.id);
            }
          } catch (e) {
            console.log('[TG delete fallback] error', e);
          }
        }
        if (ok) {
          try { await sendTelegramMessage({ chatId, text: `Отзыв #${id} удалён.` }); } catch (e) { console.log('[TG send]/delete_review_id ok', e); }
        } else {
          try { await sendTelegramMessage({ chatId, text: "Отзыв не найден." }); } catch (e) { console.log('[TG send]/delete_review_id not found', e); }
        }
        return NextResponse.json({ ok: true });
      }

      if (cmd === "/help") {
        console.log("[TG Webhook] Processing /help command for chatId:", chatId);
        const helpText = `*Доступные команды:*

/reviews [page] - Одобренные отзывы (по 10 на страницу)
/reviews_all [page] - Все отзывы (по 10 на страницу)
/delete_review_id <id> - Удалить отзыв по ID
/debug_reviews - Диагностика хранилища отзывов
/resequence - Переназначить номера заявок (0001, 0002, 0003...)
/help - Показать эту справку

Управление заявками:
Заявки приходят автоматически с кнопками для принятия/отклонения.`;
        try { 
          const result = await sendTelegramMessage({ chatId, text: helpText });
          console.log("[TG Webhook] /help sendTelegramMessage result:", result);
        } catch (e) { 
          console.log('[TG send]/help error', e); 
        }
        return NextResponse.json({ ok: true });
      }


      if (cmd === "/debug_reviews") {
        const info = store.getDebugInfo();
        const message = `*Reviews Debug*
cwd: ${info.cwd}
file: ${info.file}
exists: ${info.exists}
size: ${info.size}
all: ${info.allCount}, approved: ${info.approvedCount}`;
        try { await sendTelegramMessage({ chatId, text: message }); } catch (e) { console.log('[TG send]/debug_reviews error', e); }
        return NextResponse.json({ ok: true });
      }

      if (cmd === "/resequence") {
        try {
          store.resequenceApplicationsConsecutive();
          
          const { updateApplicationRowNumbers } = await import("@/utils/sheets");
          const appsWithSheetRow = store.applications.filter(app => app.sheetRow);
          await updateApplicationRowNumbers(appsWithSheetRow);
          
          const message = `*Переназначение номеров завершено*
Всего заявок: ${store.applications.length}
Обновлено в таблице: ${appsWithSheetRow.length}`;
          await sendTelegramMessage({ chatId, text: message });
        } catch (e) {
          console.log('[TG send]/resequence error', e);
          await sendTelegramMessage({ chatId, text: `Ошибка при переназначении: ${e}` });
        }
        return NextResponse.json({ ok: true });
      }

      if (cmd === "/test_review") {
        const testReview = {
          id: "test_" + Date.now(),
          name: "Тестовый пользователь",
          text: "Это тестовый отзыв для проверки работы бота",
          approved: true
        };
        store.addReview(testReview);
        try { await sendTelegramMessage({ chatId, text: `Добавлен тестовый отзыв #${testReview.id}` }); } catch (e) { console.log('[TG send]/test_review error', e); }
        return NextResponse.json({ ok: true });
      }
    }


    if (state.kind === "await_accept_details") {
      console.log("[TG Webhook] Processing await_accept_details for appId:", state.appId, "text:", text);
      
      // Find application in Google Sheets
      const { findApplicationInSheets, updateApplicationRow } = await import("@/utils/sheets");
      const appData = await findApplicationInSheets(state.appId);
      
      if (appData) {
        console.log("[TG Webhook] Found app in sheets:", appData);
        
        // Parse admin message into address and description
        const trimmed = (text || "").trim();
        let addressPart = trimmed;
        let descriptionPart = "";
        // try newline split
        const nlIdx = trimmed.indexOf("\n");
        if (nlIdx > -1) {
          addressPart = trimmed.slice(0, nlIdx).trim();
          descriptionPart = trimmed.slice(nlIdx + 1).trim();
        } else {
          // try common separators
          const sepMatch = trimmed.match(/\s+[\-|—|\|]\s+/);
          if (sepMatch) {
            const sep = sepMatch[0];
            const parts = trimmed.split(sep);
            addressPart = (parts[0] || "").trim();
            descriptionPart = (parts.slice(1).join(sep) || "").trim();
          }
        }
        
        // Update the row in Google Sheets
        const row: SheetRow = [
          appData.data[0], // Keep original ID
          appData.data[1], // Keep original date
          appData.data[2], // Keep original name
          appData.data[3], // Keep original phone
          addressPart, // New address
          "Выполняется", // New status
          descriptionPart, // New description
          appData.data[7] || "", // Keep original cost
          appData.data[8] || "", // Keep original note
          appData.data[9] || "", // Keep original repeat label (J)
        ];
        
        console.log("[TG Webhook] Updating row:", row);
        await updateApplicationRow(appData.rowNumber, row);
      } else {
        console.log("[TG Webhook] App not found in sheets:", state.appId);
      }
      
      store.clearState(userId);
      const buttons = inlineKeyboard([[{ text: "Выполнено", callback_data: `app_done:${state.appId}` }]]);
      await sendTelegramMessage({ chatId: process.env.TELEGRAM_CHAT_ID || "", text: `Заявка #${state.appId}: статус "Выполняется". Детали: ${text}`, replyMarkup: buttons });
      return NextResponse.json({ ok: true });
    }

    if (state.kind === "await_done") {
      console.log("[TG Webhook] Processing await_done for appId:", state.appId, "text:", text);
      
      // Find application in Google Sheets
      const { findApplicationInSheets, updateApplicationRow } = await import("@/utils/sheets");
      const appData = await findApplicationInSheets(state.appId);
      
      if (appData) {
        console.log("[TG Webhook] Found app in sheets:", appData);
        
        // Parse cost and note: "4000 Описание" -> cost=4000, note="Описание"
        const match = text.trim().match(/^(\d+[\.,]?\d*)(?:\s+)([\s\S]*)$/);
        let cost = "";
        let note = "";
        
        if (match) {
          cost = String(Number(match[1].replace(",", ".")));
          note = match[2].trim();
          console.log("[TG Webhook] Parsed cost:", cost, "note:", note);
        } else {
          // fallback: try to find first number anywhere
          const num = text.match(/(\d+[\.,]?\d*)/);
          cost = num ? String(Number(num[1].replace(",", "."))) : "";
          note = text.replace(num?.[0] || "", "").trim();
          console.log("[TG Webhook] Fallback parsed cost:", cost, "note:", note);
        }
        
        // Update the row in Google Sheets
        const row: SheetRow = [
          appData.data[0], // Keep original ID
          appData.data[1], // Keep original date
          appData.data[2], // Keep original name
          appData.data[3], // Keep original phone
          appData.data[4] || "", // Keep original address
          "Выполнено", // New status
          appData.data[6] || "", // Keep original description
          cost, // New cost
          note, // New note
          appData.data[9] || "", // Keep original repeat label (J)
        ];
        
        console.log("[TG Webhook] Updating row:", row);
        const updateResult = await updateApplicationRow(appData.rowNumber, row);
        console.log("[TG Webhook] Update result:", updateResult);
      } else {
        console.log("[TG Webhook] App not found in sheets:", state.appId);
      }
      
      store.clearState(userId);
      await sendTelegramMessage({ chatId: process.env.TELEGRAM_CHAT_ID || "", text: `Заявка #${state.appId}: статус "Выполнено". ${text}` });
      return NextResponse.json({ ok: true });
    }
  }

  return NextResponse.json({ ok: true });
}


