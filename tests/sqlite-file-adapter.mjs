import { DatabaseSync } from 'node:sqlite';

/** File-backed SQLite adapter matching the production repository's async surface. */
export class SqliteFileAdapter {
  #database;

  constructor(path) {
    this.#database = new DatabaseSync(path);
  }

  async execAsync(sql) {
    this.#database.exec(sql);
  }

  async runAsync(sql, ...params) {
    const result = this.#database.prepare(sql).run(...params);
    return {
      changes: Number(result.changes),
      lastInsertRowId: Number(result.lastInsertRowid),
    };
  }

  async getFirstAsync(sql, ...params) {
    const row = this.#database.prepare(sql).get(...params);
    return row ? { ...row } : null;
  }

  async getAllAsync(sql, ...params) {
    return this.#database.prepare(sql).all(...params).map((row) => ({ ...row }));
  }

  async closeAsync() {
    this.#database.close();
  }
}
