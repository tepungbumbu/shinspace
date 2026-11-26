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
    created_at    INTEGER NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user',
    status        TEXT    NOT NULL DEFAULT 'active'
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
    updated_at INTEGER NOT NULL,
    parent_id  TEXT    REFERENCES pages(id) ON DELETE CASCADE, -- null: a site (its home page); set: one more page of that site
    sort       INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS pages_user ON pages(user_id, updated_at);
  -- section templates added by admins; they show up in every editor's Sections tab
  CREATE TABLE IF NOT EXISTS components (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    category    TEXT    NOT NULL DEFAULT 'Custom',
    sub         TEXT    NOT NULL DEFAULT '',          -- optional sub-heading inside the category
    builtin_key TEXT,                                 -- set for the sections that shipped with the app (lets an admin reset them)
    sort        INTEGER NOT NULL DEFAULT 0,           -- order inside the Sections tab
    html        TEXT,                       -- set when the component was written as code; null when it is a block tree
    css         TEXT    NOT NULL DEFAULT '',  -- code editor: the style.css tab
    js          TEXT    NOT NULL DEFAULT '',  -- code editor: the script.js tab
    node        TEXT    NOT NULL,           -- the section tree (JSON)
    published   INTEGER NOT NULL DEFAULT 1,
    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );
  -- who did what, and when; the rows outlive a deleted account (who keeps its name and email)
  CREATE TABLE IF NOT EXISTS activity (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    who        TEXT    NOT NULL,
    action     TEXT    NOT NULL,
    detail     TEXT    NOT NULL DEFAULT '',
    ip         TEXT    NOT NULL DEFAULT '',
    device     TEXT    NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS activity_user ON activity(user_id, created_at);
  CREATE INDEX IF NOT EXISTS activity_time ON activity(created_at);
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`

// Databases created before roles existed get the new columns, and the oldest account becomes the first admin.
function migrate(d: DatabaseSync) {
  const cols = (d.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name)
  if (!cols.includes('role')) d.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
  if (!cols.includes('status')) d.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'")
  const pcols = (d.prepare('PRAGMA table_info(pages)').all() as { name: string }[]).map((c) => c.name)
  if (!pcols.includes('parent_id')) d.exec('ALTER TABLE pages ADD COLUMN parent_id TEXT REFERENCES pages(id) ON DELETE CASCADE')
  if (!pcols.includes('sort')) d.exec('ALTER TABLE pages ADD COLUMN sort INTEGER NOT NULL DEFAULT 0')
  d.exec('CREATE INDEX IF NOT EXISTS pages_parent ON pages(parent_id)')
  const ccols = (d.prepare('PRAGMA table_info(components)').all() as { name: string }[]).map((c) => c.name)
  if (!ccols.includes('sub')) d.exec("ALTER TABLE components ADD COLUMN sub TEXT NOT NULL DEFAULT ''")
  if (!ccols.includes('builtin_key')) d.exec('ALTER TABLE components ADD COLUMN builtin_key TEXT')
  if (!ccols.includes('sort')) d.exec('ALTER TABLE components ADD COLUMN sort INTEGER NOT NULL DEFAULT 0')
  if (!ccols.includes('css')) d.exec("ALTER TABLE components ADD COLUMN css TEXT NOT NULL DEFAULT ''")
  if (!ccols.includes('js')) d.exec("ALTER TABLE components ADD COLUMN js TEXT NOT NULL DEFAULT ''")
  d.exec('CREATE UNIQUE INDEX IF NOT EXISTS components_builtin ON components(builtin_key) WHERE builtin_key IS NOT NULL') // after the column exists on older databases
  d.exec("UPDATE users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM users) AND NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin')")
}

const g = globalThis as unknown as { __detikDb?: DatabaseSync } // one connection, kept across dev hot reloads
let ready = false // the schema is re-applied when this module reloads, so new tables appear without a restart

export function db() {
  if (!g.__detikDb) {
    const dir = process.env.SHINSPACE_DATA || join(process.cwd(), 'data') // SHINSPACE_DATA lets a deployment keep the database elsewhere
    mkdirSync(dir, { recursive: true })
    g.__detikDb = new DatabaseSync(join(dir, 'app.db'))
  }
  if (!ready) {
    g.__detikDb.exec(SCHEMA)
    migrate(g.__detikDb)
    ready = true
  }
  return g.__detikDb
}
