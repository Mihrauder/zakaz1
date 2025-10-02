export type ApplicationItem = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  address: string;
  description: string;
  status: "Новая" | "Повторный" | "Выполняется" | "Отказ" | "Выполнено";
  cost?: number;
  note?: string;
  sheetRow?: number;
};

export type ReviewItem = {
  id: string;
  name: string;
  text: string;
  approved: boolean;
};

export type UserState =
  | { kind: "idle" }
  | { kind: "await_decline_note"; appId: string }
  | { kind: "await_accept_details"; appId: string }
  | { kind: "await_done"; appId: string };

import path from "path";
import fs from "fs";

class InMemoryStore {
  applications: ApplicationItem[] = [];
  reviews: ReviewItem[] = [];
  userStates: Map<string, UserState> = new Map();

  private isLoaded = false;
  private nextAppSeq = 1;

  private getDataFilePath() {
    return path.join(process.cwd(), "data", "server-data.json");
  }

  loadFromDisk() {
    if (this.isLoaded) return;
    this.isLoaded = true;
    try {
      const file = this.getDataFilePath();
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf8");
        const parsed = JSON.parse(raw || "{}");
        this.applications = Array.isArray(parsed.applications) ? parsed.applications : [];
        this.reviews = Array.isArray(parsed.reviews) ? parsed.reviews : [];
        this.nextAppSeq = Number(parsed.nextAppSeq ?? 1) || 1;
      }
    } catch (err) {
      console.log("[Store] saveToDisk failed", err);
    }
  }

  reloadFromDisk() {
    this.isLoaded = false;
    this.loadFromDisk();
  }

  resequenceApplicationsConsecutive() {
    this.loadFromDisk();
    console.log("[Store] Resequencing applications to consecutive IDs");
    const sorted = [...this.applications].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let seq = 1;
    for (const app of sorted) {
      const oldId = app.id;
      app.id = this.formatSeq(seq++);
      console.log("[Store] Resequenced:", oldId, "->", app.id);
    }
    this.applications = sorted;
    this.nextAppSeq = seq;
    this.saveToDisk();
    console.log("[Store] Resequencing complete. Next sequence:", this.nextAppSeq);
  }

  private reloadReviewsFromDisk() {
    try {
      const file = this.getDataFilePath();
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, "utf8");
        const parsed = JSON.parse(raw || "{}");
        this.reviews = Array.isArray(parsed.reviews) ? parsed.reviews : [];
      }
    } catch {}
  }

  private saveToDisk() {
    try {
      const file = this.getDataFilePath();
      const data = JSON.stringify({ applications: this.applications, reviews: this.reviews, nextAppSeq: this.nextAppSeq }, null, 2);
      fs.writeFileSync(file, data, "utf8");
    } catch {}
  }

  getOrIdle(userId: string): UserState {
    this.loadFromDisk();
    const state = this.userStates.get(userId) ?? { kind: "idle" };
    console.log("[Store] Getting state for userId:", userId, "state:", state);
    return state;
  }

  setState(userId: string, state: UserState) {
    console.log("[Store] Setting state for userId:", userId, "state:", state);
    this.userStates.set(userId, state);
  }

  clearState(userId: string) {
    this.userStates.delete(userId);
  }

  private formatSeq(n: number): string {
    return n.toString().padStart(4, "0");
  }

  async addApplicationAndAssignId(app: Omit<ApplicationItem, "id">): Promise<ApplicationItem> {
    this.loadFromDisk();
    
    let nextNumber = this.nextAppSeq;
    try {
      const { getNextApplicationNumber } = await import("@/utils/sheets");
      const sheetsNextNumber = await getNextApplicationNumber();
      nextNumber = Math.max(this.nextAppSeq, sheetsNextNumber);
      console.log("[Store] Using next number:", nextNumber, "from sheets:", sheetsNextNumber, "from memory:", this.nextAppSeq);
    } catch {
      console.log("[Store] Failed to get next number from sheets, using memory:", this.nextAppSeq);
    }
    
    const id = this.formatSeq(nextNumber);
    this.nextAppSeq = nextNumber + 1;
    const item: ApplicationItem = { ...app, id };
    this.applications.push(item);
    this.saveToDisk();
    return item;
  }

  deleteApplicationById(id: string): boolean {
    this.loadFromDisk();
    const idx = this.applications.findIndex(a => a.id === id);
    if (idx < 0) return false;
    this.applications.splice(idx, 1);
    this.resequenceApplications();
    this.saveToDisk();
    return true;
  }

  resequenceApplications() {
    const sorted = [...this.applications].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let seq = 1;
    for (const app of sorted) {
      app.id = this.formatSeq(seq++);
    }
    this.applications = sorted;
    this.nextAppSeq = seq;
  }

  listApprovedReviews(): ReviewItem[] {
    this.reloadReviewsFromDisk();
    return this.reviews.filter(r => r.approved);
  }

  listAllReviews(): ReviewItem[] {
    this.reloadReviewsFromDisk();
    return this.reviews;
  }

  addReview(item: ReviewItem) {
    this.loadFromDisk();
    this.reviews.unshift(item);
    this.saveToDisk();
  }

  approveReview(id: string): boolean {
    this.loadFromDisk();
    const r = this.reviews.find(x => x.id === id);
    if (!r) return false;
    r.approved = true;
    this.saveToDisk();
    return true;
  }

  deleteReview(id: string): boolean {
    this.loadFromDisk();
    const idx = this.reviews.findIndex(r => r.id === id);
    if (idx < 0) return false;
    this.reviews.splice(idx, 1);
    this.saveToDisk();
    return true;
  }

  deleteApprovedReviews(): number {
    this.loadFromDisk();
    const before = this.reviews.length;
    this.reviews = this.reviews.filter(r => !r.approved);
    const removed = before - this.reviews.length;
    if (removed > 0) this.saveToDisk();
    return removed;
  }

  deleteAllReviews(): number {
    this.loadFromDisk();
    const removed = this.reviews.length;
    this.reviews = [];
    if (removed > 0) this.saveToDisk();
    return removed;
  }

  getDebugInfo() {
    this.loadFromDisk();
    try {
      const file = this.getDataFilePath();
      const exists = fs.existsSync(file);
      const size = exists ? fs.statSync(file).size : 0;
      return {
        cwd: process.cwd(),
        file,
        exists,
        size,
        allCount: this.reviews.length,
        approvedCount: this.reviews.filter(r => r.approved).length,
      };
    } catch {
      return { cwd: process.cwd(), file: this.getDataFilePath(), exists: false, size: 0, allCount: this.reviews.length, approvedCount: this.reviews.filter(r => r.approved).length };
    }
  }
}

export const store = new InMemoryStore();

import Database from "better-sqlite3";

function getDb() {
  const dbPath = path.join(process.cwd(), "data", "reviews.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
  );`);
  return db;
}

export const reviewsDb = {
  upsert(review: ReviewItem) {
    const db = getDb();
    const stmt = db.prepare(`INSERT INTO reviews (id, name, text, approved) VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, text=excluded.text, approved=excluded.approved`);
    stmt.run(review.id, review.name, review.text, review.approved ? 1 : 0);
    db.close();
  },
  approve(id: string) {
    const db = getDb();
    const stmt = db.prepare(`UPDATE reviews SET approved=1 WHERE id=?`);
    const info = stmt.run(id);
    db.close();
    return info.changes > 0;
  },
  delete(id: string) {
    const db = getDb();
    const stmt = db.prepare(`DELETE FROM reviews WHERE id=?`);
    const info = stmt.run(id);
    db.close();
    return info.changes > 0;
  },
  listApproved(limit: number) {
    const db = getDb();
    const rows = db.prepare(`SELECT id, name, text FROM reviews WHERE approved=1 ORDER BY created_at DESC LIMIT ?`).all(limit);
    db.close();
    return rows as Pick<ReviewItem, 'id'|'name'|'text'>[];
  },
  listAll() {
    const db = getDb();
    const rows = db.prepare(`SELECT id, name, text, approved FROM reviews ORDER BY created_at DESC`).all();
    db.close();
    return rows as ReviewItem[];
  }
};


