import { PrismaClient } from './src/app/generated/prisma/client';
import 'dotenv/config';

// Configure connection pool settings in DATABASE_URL
// For pgbouncer in session mode, use a conservative connection limit
// Supabase pgbouncer typically allows 1-4 connections in session mode
let databaseUrl = process.env.DATABASE_URL || '';
if (databaseUrl) {
  // For pgbouncer, we need to use a lower connection_limit to match pooler limits
  // If using Supabase pooler, typical limits are 1-4 connections
  const isPgbouncer = databaseUrl.includes('pgbouncer=true') || databaseUrl.includes('pooler.supabase.com');
  
  if (isPgbouncer) {
    // Using Supabase transaction pooler (port 6543) — connections are released after
    // each query, so a small pool handles hundreds of concurrent requests.
    // connection_limit=5 is plenty since connections are never held idle.
    if (databaseUrl.includes('connection_limit=')) {
      databaseUrl = databaseUrl.replace(/connection_limit=\d+/g, 'connection_limit=5');
    } else {
      const separator = databaseUrl.includes('?') ? '&' : '?';
      databaseUrl = `${databaseUrl}${separator}connection_limit=5`;
    }

    // pgbouncer=true disables prepared statements (required for transaction mode)
    if (!databaseUrl.includes('pgbouncer=true')) {
      const separator = databaseUrl.includes('?') ? '&' : '?';
      databaseUrl = `${databaseUrl}${separator}pgbouncer=true`;
    }
  } else {
    // For direct connections, use higher limit
    if (databaseUrl.includes('connection_limit=')) {
      databaseUrl = databaseUrl.replace(/connection_limit=\d+/g, 'connection_limit=10');
    } else {
      const separator = databaseUrl.includes('?') ? '&' : '?';
      databaseUrl = `${databaseUrl}${separator}connection_limit=10`;
    }
  }
  
  // Replace or add pool_timeout parameter (30 seconds to handle bursts)
  if (databaseUrl.includes('pool_timeout=')) {
    databaseUrl = databaseUrl.replace(/pool_timeout=\d+/g, 'pool_timeout=30');
  } else {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${separator}pool_timeout=30`;
  }
}

// Configure Prisma client with connection pool settings
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

// Handle connection pool errors gracefully
prisma.$on('error' as never, (e: any) => {
  console.error('Prisma Client Error:', e);
});

// Warm up connection pool on startup — establishes DB connections BEFORE
// any request arrives, so the first dashboard load doesn't pay connection cost
prisma.$connect()
  .then(() => prisma.$queryRawUnsafe('SELECT 1'))
  .then(() => console.log('✅ Prisma connection pool warmed up'))
  .catch((e: any) => console.error('⚠️ Prisma warmup failed:', e.message));

// Ensure connections are properly closed on app termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});


export default prisma;

