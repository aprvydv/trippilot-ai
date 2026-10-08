import type { GeneratedTrip } from './ai';
export interface SavedTrip extends GeneratedTrip { id: string; createdAt: string }
export class TripRepository {
  constructor(private db: D1Database) {}
  async save(owner: string, value: GeneratedTrip, isSaved = true): Promise<SavedTrip> {
    const saved = { ...value, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    await this.db.prepare('INSERT INTO trips (id, owner_id, trip_json, created_at, is_saved) VALUES (?, ?, ?, ?, ?)').bind(saved.id, owner, JSON.stringify(value), saved.createdAt, isSaved ? 1 : 0).run();
    return saved;
  }
  async list(owner: string): Promise<SavedTrip[]> {
    const result = await this.db.prepare('SELECT id, trip_json, created_at FROM trips WHERE owner_id = ? AND is_saved = 1 ORDER BY created_at DESC, id DESC LIMIT 50').bind(owner).all<{ id: string; trip_json: string; created_at: string }>();
    return result.results.map(row => ({ ...JSON.parse(row.trip_json), id: row.id, createdAt: row.created_at }));
  }
  async get(owner: string, id: string): Promise<SavedTrip | null> {
    const row = await this.db.prepare('SELECT id, trip_json, created_at FROM trips WHERE owner_id = ? AND id = ?').bind(owner, id).first<{ id: string; trip_json: string; created_at: string }>();
    return row ? { ...JSON.parse(row.trip_json), id: row.id, createdAt: row.created_at } : null;
  }
  async remove(owner: string, id: string): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM trips WHERE owner_id = ? AND id = ?').bind(owner, id).run();
    return (result.meta.changes || 0) > 0;
  }
  async markSaved(owner: string, id: string): Promise<SavedTrip | null> {
    const existing = await this.get(owner, id);
    if (!existing) return null;
    await this.db.prepare('UPDATE trips SET is_saved = 1 WHERE owner_id = ? AND id = ?').bind(owner, id).run();
    return existing;
  }
  async pruneDrafts(owner: string): Promise<void> {
    await this.db.prepare('DELETE FROM trips WHERE owner_id = ? AND is_saved = 0 AND created_at < ?').bind(owner, new Date(Date.now() - 86400000).toISOString()).run();
  }
}
