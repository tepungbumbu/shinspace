// SQLite file database (Node's built-in driver, no install). Swap this one file to move to MySQL/Postgres.
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    created_at    INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
  CREATE TABLE IF NOT EXISTS pages (
    id         TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT    NOT NULL,
    root       TEXT    NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS pages_user ON pages(user_id, updated_at);
`

const g = globalThis as unknown as { __detikDb?: DatabaseSync } // one connection, kept across dev hot reloads
let ready = false // the schema is re-applied when this module reloads, so new tables appear without a restart

export function db() {
  if (!g.__detikDb) {
    const dir = join(process.cwd(), 'data')
    mkdirSync(dir, { recursive: true })
    g.__detikDb = new DatabaseSync(join(dir, 'app.db'))
  }
  if (!ready) {
    g.__detikDb.exec(SCHEMA)
    ready = true
  }
  return g.__detikDb
}
