import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type Database = ReturnType<typeof createDatabase>;

let cachedDatabase: Database | undefined;

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const client = postgres(databaseUrl, {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
    prepare: false,
    ssl: 'require',
  });

  return drizzle(client, { schema });
}

export function getDatabase(): Database {
  cachedDatabase ??= createDatabase();
  return cachedDatabase;
}
