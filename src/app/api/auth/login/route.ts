import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { NextRequest, NextResponse } from "next/server";
import { execute, query, withTransaction } from "@/lib/db";
import { createSession, hashNetworkAddress } from "@/lib/auth";
import { assertSameOrigin, getClientAddress, jsonError, safeErrorResponse } from "@/lib/http";
import { loginSchema } from "@/lib/schemas";
import type { AdminRole } from "@/lib/db-types";
import type { RowDataPacket } from "mysql2/promise";

const MAX_ATTEMPTS = 5;
const timingHash = "$argon2id$v=19$m=19456,t=2,p=1$YWFhYWFhYWFhYWFhYWFhYQ$1t8kqgRhL7khzxn6eR5adEsE2pxTyfPUUUGW8bq6g4w";

interface LoginAttemptRow extends RowDataPacket {
  blockedUntil: Date | null;
}

interface AdminRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: number | boolean;
  passwordHash: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!assertSameOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Enter a valid email address and password.", 400);

  const email = parsed.data.email;
  const addressHash = hashNetworkAddress(getClientAddress(request));
  const now = new Date();
  try {
    const [limiter] = await query<LoginAttemptRow>(
      "SELECT blockedUntil FROM LoginAttempt WHERE email = ? AND addressHash = ? LIMIT 1",
      [email, addressHash],
    );
    if (limiter?.blockedUntil && limiter.blockedUntil > now) {
      return jsonError("Too many sign-in attempts. Try again later.", 429);
    }

    const [user] = await query<AdminRow>(
      "SELECT id, name, email, role, active, passwordHash FROM AdminUser WHERE email = ? LIMIT 1",
      [email],
    );
    const passwordMatches = await argon2.verify(user?.passwordHash ?? timingHash, parsed.data.password).catch(() => false);
    if (!user || !user.active || !passwordMatches) {
      await execute(
        `INSERT INTO LoginAttempt (id, email, addressHash, attempts, windowStart, blockedUntil)
         VALUES (?, ?, ?, 1, ?, NULL)
         ON DUPLICATE KEY UPDATE
           attempts = IF(windowStart < DATE_SUB(NOW(3), INTERVAL 15 MINUTE), 1, attempts + 1),
           blockedUntil = IF(attempts >= ?, DATE_ADD(NOW(3), INTERVAL 15 MINUTE), NULL),
           windowStart = IF(windowStart < DATE_SUB(NOW(3), INTERVAL 15 MINUTE), NOW(3), windowStart)`,
        [randomBytes(15).toString("base64url"), email, addressHash, now, MAX_ATTEMPTS],
      );
      const [updatedLimiter] = await query<LoginAttemptRow>(
        "SELECT blockedUntil FROM LoginAttempt WHERE email = ? AND addressHash = ? LIMIT 1",
        [email, addressHash],
      );
      return updatedLimiter?.blockedUntil && updatedLimiter.blockedUntil > now
        ? jsonError("Too many sign-in attempts. Try again later.", 429)
        : jsonError("Email or password is incorrect.", 401);
    }

    await withTransaction(async connection => {
      await execute("DELETE FROM LoginAttempt WHERE email = ? AND addressHash = ?", [email, addressHash], connection);
      await execute("UPDATE AdminUser SET lastLoginAt = ?, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?", [now, user.id], connection);
      await execute(
        "INSERT INTO AuditLog (id, userId, action, entity, entityId) VALUES (?, ?, 'AUTH_LOGIN', 'AdminUser', ?)",
        [randomBytes(15).toString("base64url"), user.id, user.id],
        connection,
      );
    });
    await createSession(user.id);
    return NextResponse.json({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
