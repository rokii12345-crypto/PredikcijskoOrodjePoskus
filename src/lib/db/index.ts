import { createClient, type Client, type InArgs } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const SCHEMA = `
create table if not exists users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  display_name text,
  created_at text not null default (datetime('now'))
);

create table if not exists projects (
  id text primary key,
  owner_user_id text not null references users(id) on delete cascade,
  name text not null,
  project_type text not null default 'house_new_build',
  start_date text not null,
  target_end_date text,
  scheduling_mode text not null default 'forward',
  currency text not null default 'EUR',
  contingency_percent real not null default 10,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists project_members (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  role text not null default 'owner',
  created_at text not null default (datetime('now')),
  unique(project_id, user_id)
);

create table if not exists investors (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  name text not null,
  share_percent real not null default 0,
  email text,
  note text
);

create table if not exists funding_sources (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  name text not null,
  type text not null,
  available_amount real not null default 0,
  available_from text not null,
  investor_id text references investors(id) on delete set null,
  note text
);

create table if not exists tasks (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  parent_code text,
  code text not null,
  name text not null,
  type text not null,
  duration_days integer not null default 0,
  start_date text,
  end_date text,
  dependencies text not null default '[]',
  progress_percent real not null default 0,
  status text not null default 'planned',
  default_funding_source_type text,
  sort_order integer not null default 0,
  optional_key text,
  included integer not null default 1,
  unique(project_id, code)
);

create table if not exists cost_items (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  task_code text not null,
  name text not null,
  supplier text,
  status text not null default 'estimate',
  estimated_amount real not null default 0,
  contracted_amount real,
  actual_amount real,
  vat_rate real,
  amount_includes_vat integer not null default 1,
  default_funding_source_type text,
  payment_rule_code text not null,
  note text,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);

create table if not exists payment_events (
  id text primary key,
  project_id text not null references projects(id) on delete cascade,
  cost_item_id text not null references cost_items(id) on delete cascade,
  task_code text not null,
  name text not null,
  planned_date text not null,
  planned_amount real not null default 0,
  actual_date text,
  actual_amount real,
  funding_source_type text,
  status text not null default 'planned'
);
`;

function isBusyError(error: unknown): boolean {
  return error instanceof Error && /database is locked|SQLITE_BUSY/i.test(error.message);
}

/**
 * In local file: mode, Next.js build/dev spawns several separate worker
 * processes that race to create/initialize the same SQLite file. Retrying
 * with backoff avoids the occasional "database is locked" failure on a
 * cold start. Turso's remote libsql: mode is a real server and doesn't hit
 * this, but the retry is harmless there too.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 10): Promise<T> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isBusyError(error) || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
    }
  }

  throw new Error("unreachable");
}

function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL;
  if (configured) return configured;

  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return `file:${path.join(dataDir, "gradnjaplan.db")}`;
}

function createDbClient(): Client {
  return createClient({
    url: resolveDatabaseUrl(),
    authToken: process.env.DATABASE_AUTH_TOKEN
  });
}

async function initSchema(client: Client): Promise<void> {
  await withRetry(() => client.execute("PRAGMA foreign_keys = ON;"));
  await withRetry(() => client.executeMultiple(SCHEMA));
}

declare global {
  var __gradnjaplanDb: Client | undefined;
  var __gradnjaplanDbReady: Promise<void> | undefined;
}

export const db = globalThis.__gradnjaplanDb ?? createDbClient();
export const dbReady = globalThis.__gradnjaplanDbReady ?? initSchema(db);

if (process.env.NODE_ENV !== "production") {
  globalThis.__gradnjaplanDb = db;
  globalThis.__gradnjaplanDbReady = dbReady;
}

export type QueryArgs = InArgs;

export async function queryAll<T = Record<string, unknown>>(sql: string, args?: QueryArgs): Promise<T[]> {
  await dbReady;
  const result = await withRetry(() => db.execute({ sql, args: args ?? [] }));
  return result.rows as unknown as T[];
}

export async function queryOne<T = Record<string, unknown>>(sql: string, args?: QueryArgs): Promise<T | null> {
  const rows = await queryAll<T>(sql, args);
  return rows[0] ?? null;
}

export async function execute(sql: string, args?: QueryArgs) {
  await dbReady;
  return withRetry(() => db.execute({ sql, args: args ?? [] }));
}
