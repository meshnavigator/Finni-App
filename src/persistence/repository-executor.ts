import type { SqlDatabase } from './database.ts';

/** Owns one connection and serializes every repository access. */
export class RepositoryExecutor {
  readonly #database: SqlDatabase;
  #tail: Promise<void> = Promise.resolve();
  #closing = false;
  #closed = false;

  constructor(database: SqlDatabase) {
    this.#database = database;
  }

  run<T>(work: (database: SqlDatabase) => Promise<T>): Promise<T> {
    if (this.#closing || this.#closed) {
      return Promise.reject(new Error('RepositoryExecutor is closed'));
    }
    const result = this.#tail.then(() => work(this.#database));
    this.#tail = result.then(() => undefined, () => undefined);
    return result;
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    if (this.#closing) {
      await this.#tail;
      return;
    }
    this.#closing = true;
    const close = this.#tail.then(() => this.#database.closeAsync());
    this.#tail = close.then(() => undefined, () => undefined);
    try {
      await close;
      this.#closed = true;
    } finally {
      this.#closing = false;
    }
  }
}
