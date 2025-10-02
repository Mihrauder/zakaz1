export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { store, type ReviewItem, reviewsDb } from "@/server/store";
import { inlineKeyboard } from "@/utils/telegram";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 10);
  const items = reviewsDb.listApproved(limit);
  return new NextResponse(JSON.stringify({ items }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").slice(0, 64) || "Аноним";
  const text = String(body.text ?? "").slice(0, 1000);
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
  const item: ReviewItem = { id: Math.random().toString(36).slice(2, 9), name, text, approved: false };
  try { store.addReview(item); } catch {}
  reviewsDb.upsert(item);

  try {
    const textMsg = `Новый отзыв \n От: ${item.name}\n\n${item.text}`;
    const buttons = inlineKeyboard([[{ text: "Разрешить", callback_data: `review_approve:${item.id}` }, { text: "Запретить", callback_data: `review_reject:${item.id}` }]]);
    const { sendTelegramMessage } = await import("@/utils/telegram");
    await sendTelegramMessage({ chatId: "", text: textMsg, replyMarkup: buttons });
  } catch (e) {
    console.log("[TG] review notify skipped", e);
  }
  return NextResponse.json({ ok: true, id: item.id });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    const removed = store.deleteAllReviews();
    return NextResponse.json({ ok: true, removed });
  }

  const ok = store.deleteReview(id) || reviewsDb.delete(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}


