import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';

if (!connectionString) {
  throw new Error('DATABASE_URL is not set — add the Supabase connection string to server/.env');
}

if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
  throw new Error(
    `DATABASE_URL must be a postgres:// connection string (got "${connectionString.slice(0, 24)}…"). ` +
      'Keep the SQLite file URL in SQLITE_URL — that is what Prisma uses.'
  );
}

const sql = postgres(connectionString, {
  connect_timeout: 15,
  idle_timeout: 20,
  max: 10
});

export default sql;
