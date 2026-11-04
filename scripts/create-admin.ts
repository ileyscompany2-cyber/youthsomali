import "dotenv/config";

import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import argon2 from "argon2";
import { closeDatabasePool, execute, query, withTransaction } from "../src/lib/db";
import type { RowDataPacket } from "mysql2/promise";
import { userCreateSchema } from "../src/lib/schemas";

const readline = createInterface({ input: stdin, output: stdout });

async function main() {
  const name = (process.env.INITIAL_ADMIN_NAME || await readline.question("Administrator name: ")).trim();
  const email = (process.env.INITIAL_ADMIN_EMAIL || await readline.question("Administrator email: ")).trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD || await readline.question("Initial administrator password (input is visible; prefer INITIAL_ADMIN_PASSWORD in the environment): ");
  const parsed = userCreateSchema.safeParse({ name, email, password, role: "SUPER_ADMIN", active: true });
  delete process.env.INITIAL_ADMIN_PASSWORD;
  if (!parsed.success) throw new Error("Provide a valid name, email, and password of at least 12 characters.");

  const passwordHash = await argon2.hash(parsed.data.password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
  const adminId = randomBytes(15).toString("base64url");
  await withTransaction(async connection => {
    const existing = await query<RowDataPacket & { id: string }>(
      "SELECT id FROM AdminUser WHERE email = ? LIMIT 1 FOR UPDATE",
      [parsed.data.email],
      connection,
    );
    if (existing.length) throw new Error("An administrator already exists with that email address.");
    await execute(
      `INSERT INTO AdminUser (id, name, email, passwordHash, role, active, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'SUPER_ADMIN', 1, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))`,
      [adminId, parsed.data.name, parsed.data.email, passwordHash],
      connection,
    );
    await execute(
      "INSERT INTO AuditLog (id, userId, action, entity, entityId) VALUES (?, NULL, 'INITIAL_ADMIN_CREATE', 'AdminUser', ?)",
      [randomBytes(15).toString("base64url"), adminId],
      connection,
    );
  });
  console.log(`Created initial super administrator ${parsed.data.email} (${adminId}).`);
}

main()
  .catch(error => {
    console.error("Could not create the initial administrator.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    readline.close();
    await closeDatabasePool();
  });
