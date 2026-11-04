import {
  createPool,
  type ExecuteValues,
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

declare global {
  var yppMysqlPool: Pool | undefined;
}

function parseDatabaseConfig(): Parameters<typeof createPool>[0] {
  const databaseUrl = process.env.DATABASE_URL;
  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;

  if (host && database && user && password) {
    const port = Number(process.env.DB_PORT ?? 3306);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("DB_PORT must be a valid TCP port.");
    return {
      host,
      port,
      database,
      user,
      password,
      ssl: parseSslConfig(),
    };
  }

  if (!databaseUrl) throw new Error("Configure DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD.");
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid MySQL connection URL.");
  }
  if (url.protocol !== "mysql:" || !url.hostname || !url.pathname.slice(1) || !url.username || !url.password) {
    throw new Error("DATABASE_URL must include a MySQL host, database name, username, and password.");
  }
  const hostName = url.hostname.replace(/^\[|\]$/g, "");
  const loopback = hostName === "localhost" || hostName === "127.0.0.1" || hostName === "::1";
  const ssl = process.env.DB_SSL === "true" || (process.env.NODE_ENV === "production" && !loopback);
  return {
    host: hostName,
    port: Number(url.port || process.env.DB_PORT || 3306),
    database: decodeURIComponent(url.pathname.slice(1)),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: ssl ? parseSslConfig() : undefined,
  };
}

function parseSslConfig(): { rejectUnauthorized: boolean; ca?: string } | undefined {
  const enabled = process.env.DB_SSL === "true" || (process.env.NODE_ENV === "production" && process.env.DB_HOST !== "127.0.0.1" && process.env.DB_HOST !== "localhost");
  if (!enabled) return undefined;
  const ca = process.env.DB_SSL_CA?.replace(/\\n/g, "\n");
  return { rejectUnauthorized: true, ...(ca ? { ca } : {}) };
}

function getPool(): Pool {
  if (!globalThis.yppMysqlPool) {
    const config = parseDatabaseConfig();
    globalThis.yppMysqlPool = createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: process.env.VERCEL ? 1 : 5,
      maxIdle: process.env.VERCEL ? 1 : 5,
      idleTimeout: 60_000,
      queueLimit: 20,
      enableKeepAlive: true,
      connectTimeout: 10_000,
      dateStrings: false,
      decimalNumbers: true,
    });
  }
  return globalThis.yppMysqlPool;
}

export async function query<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  values: readonly ExecuteValues[] = [],
  connection?: PoolConnection,
): Promise<T[]> {
  const executor = connection ?? getPool();
  const [rows] = await executor.execute<T[]>(sql, [...values]);
  return rows;
}

export async function execute(
  sql: string,
  values: readonly ExecuteValues[] = [],
  connection?: PoolConnection,
): Promise<ResultSetHeader> {
  const executor = connection ?? getPool();
  const [result] = await executor.execute<ResultSetHeader>(sql, [...values]);
  return result;
}

export async function withTransaction<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Could not roll back MySQL transaction.", rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}

export async function withConnection<T>(work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await getPool().getConnection();
  try {
    return await work(connection);
  } finally {
    connection.release();
  }
}

export function closeDatabasePool(): Promise<void> {
  if (!globalThis.yppMysqlPool) return Promise.resolve();
  const pool = globalThis.yppMysqlPool;
  globalThis.yppMysqlPool = undefined;
  return pool.end();
}

export function isDuplicateEntryError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

export function isMissingRowError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "affectedRows" in error && error.affectedRows === 0;
}
