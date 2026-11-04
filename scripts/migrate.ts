import "dotenv/config";

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { closeDatabasePool, execute, query, withConnection } from "../src/lib/db";
import type { RowDataPacket } from "mysql2/promise";

const initialSchemaTables = [
  "AdminUser", "AdminSession", "LoginAttempt", "ArticleCategory", "Article", "ArticleTag", "Program",
  "Project", "Event", "GalleryImage", "TeamMember", "Partner", "Publication", "ContactMessage",
  "Testimonial", "ContactRateLimit", "WebsiteSetting", "MediaAsset", "AuditLog", "_ArticleToArticleTag",
];

interface MigrationRow extends RowDataPacket {
  migration_name: string;
  checksum: string;
}

interface TableCountRow extends RowDataPacket {
  total: number;
}

async function applyMigrations() {
  const directory = path.resolve("database", "migrations");
  const files = (await readdir(directory)).filter(file => /^\d+_[a-z0-9_-]+\.sql$/i.test(file)).sort();
  if (!files.length) throw new Error("No native SQL migrations were found in database/migrations.");

  await withConnection(async connection => {
    const [lock] = await query<RowDataPacket & { acquired: number }>(
      "SELECT GET_LOCK('ypp_native_schema_migrations', 15) AS acquired",
      [],
      connection,
    );
    if (Number(lock?.acquired) !== 1) throw new Error("Could not obtain the database migration lock.");
    try {
      await execute(
        `CREATE TABLE IF NOT EXISTS native_schema_migrations (
          migration_name VARCHAR(191) NOT NULL,
          checksum CHAR(64) NOT NULL,
          applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (migration_name)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
        [],
        connection,
      );

      for (const file of files) {
        const sql = await readFile(path.join(directory, file), "utf8");
        const checksum = createHash("sha256").update(sql).digest("hex");
        const [recorded] = await query<MigrationRow>(
          "SELECT migration_name, checksum FROM native_schema_migrations WHERE migration_name = ? LIMIT 1",
          [file],
          connection,
        );
        if (recorded) {
          if (recorded.checksum !== checksum) throw new Error(`Applied migration ${file} has been edited; add a new migration instead.`);
          console.log(`Already applied ${file}`);
          continue;
        }

        if (file.startsWith("001_")) {
          const [tables] = await query<TableCountRow>(
            `SELECT COUNT(*) AS total FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${initialSchemaTables.map(() => "?").join(", ")})`,
            initialSchemaTables,
            connection,
          );
          const existingCount = Number(tables?.total ?? 0);
          if (existingCount === initialSchemaTables.length) {
            await execute(
              "INSERT INTO native_schema_migrations (migration_name, checksum) VALUES (?, ?)",
              [file, checksum],
              connection,
            );
            console.log(`Safely baselined existing YPP schema: ${file}`);
            continue;
          }
          if (existingCount !== 0) {
            throw new Error(`Found ${existingCount} of ${initialSchemaTables.length} expected YPP tables. Back up and inspect this database; no schema migration was applied.`);
          }
        }

        const statements = sql
          .split(";")
          .map(statement => statement.replace(/^\s*(?:--[^\r\n]*(?:\r?\n|$)\s*)*/g, "").trim())
          .filter(Boolean);
        for (const statement of statements) await execute(statement, [], connection);
        await execute(
          "INSERT INTO native_schema_migrations (migration_name, checksum) VALUES (?, ?)",
          [file, checksum],
          connection,
        );
        console.log(`Applied ${file}`);
      }
    } finally {
      await query("SELECT RELEASE_LOCK('ypp_native_schema_migrations')", [], connection);
    }
  });
}

applyMigrations()
  .catch(error => {
    console.error("Native MySQL migrations failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
