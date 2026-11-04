import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import type { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { execute, isDuplicateEntryError, query, withTransaction } from "@/lib/db";
import type { AdminRole } from "@/lib/db-types";
import { assertSameOrigin, jsonError, safeErrorResponse } from "@/lib/http";
import { userCreateSchema, userUpdateSchema } from "@/lib/schemas";

interface AdminRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: number | boolean;
}

const createId = () => randomBytes(15).toString("base64url");

export async function GET(): Promise<NextResponse> {
  try {
    const actor = await getCurrentAdmin();
    if (actor?.role !== "SUPER_ADMIN") return jsonError("Only a super administrator can manage administrator accounts.", 403);
    const users = await query(
      "SELECT id, name, email, role, active, lastLoginAt, createdAt FROM AdminUser ORDER BY createdAt DESC",
    );
    return NextResponse.json({ users });
  } catch (error) {
    return safeErrorResponse(error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!assertSameOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  try {
    const actor = await getCurrentAdmin();
    if (actor?.role !== "SUPER_ADMIN") return jsonError("Only a super administrator can create administrator accounts.", 403);
    const parsed = userCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError("Review the administrator details and try again.", 400);
    const passwordHash = await argon2.hash(parsed.data.password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    const userId = createId();
    const user = await withTransaction(async connection => {
      await execute(
        "INSERT INTO AdminUser (id, name, email, passwordHash, role, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))",
        [userId, parsed.data.name, parsed.data.email, passwordHash, parsed.data.role, parsed.data.active],
        connection,
      );
      await execute(
        "INSERT INTO AuditLog (id, userId, action, entity, entityId) VALUES (?, ?, 'ADMIN_CREATE', 'AdminUser', ?)",
        [createId(), actor.id, userId],
        connection,
      );
      const [created] = await query("SELECT id, name, email, role, active, createdAt FROM AdminUser WHERE id = ? LIMIT 1", [userId], connection);
      return created;
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (isDuplicateEntryError(error)) return jsonError("An account already uses that email address.", 409);
    return safeErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  if (!assertSameOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  try {
    const actor = await getCurrentAdmin();
    if (actor?.role !== "SUPER_ADMIN") return jsonError("Only a super administrator can edit administrator accounts.", 403);
    const body = await request.json().catch(() => null) as { id?: unknown; data?: unknown } | null;
    if (!body || typeof body.id !== "string" || body.id.length > 30) return jsonError("A valid administrator ID is required.", 400);
    const parsed = userUpdateSchema.safeParse(body.data);
    if (!parsed.success) return jsonError("Review the administrator details and try again.", 400);
    if (body.id === actor.id && parsed.data.active === false) return jsonError("You cannot deactivate your own administrator account.", 400);
    const { password, ...userData } = parsed.data;
    const passwordHash = password
      ? await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })
      : null;
    const outcome = await withTransaction(async connection => {
      const [current] = await query<AdminRow>(
        "SELECT id, name, email, role, active FROM AdminUser WHERE id = ? FOR UPDATE",
        [body.id as string],
        connection,
      );
      if (!current) return { kind: "missing" as const };
      if (current.role === "SUPER_ADMIN" && current.active && (userData.role !== "SUPER_ADMIN" || !userData.active)) {
        const [count] = await query<RowDataPacket & { total: number }>(
          "SELECT COUNT(*) AS total FROM AdminUser WHERE role = 'SUPER_ADMIN' AND active = 1",
          [],
          connection,
        );
        if (Number(count?.total ?? 0) <= 1) return { kind: "last-super-admin" as const };
      }
      await execute(
        `UPDATE AdminUser SET name = ?, email = ?, role = ?, active = ?, ${passwordHash ? "passwordHash = ?," : ""} updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [
          userData.name,
          userData.email,
          userData.role,
          userData.active,
          ...(passwordHash ? [passwordHash] : []),
          body.id as string,
        ],
        connection,
      );
      if (!userData.active || passwordHash || current.email !== userData.email || current.role !== userData.role) {
        await execute("DELETE FROM AdminSession WHERE userId = ?", [body.id as string], connection);
      }
      await execute(
        "INSERT INTO AuditLog (id, userId, action, entity, entityId) VALUES (?, ?, 'ADMIN_UPDATE', 'AdminUser', ?)",
        [createId(), actor.id, body.id as string],
        connection,
      );
      const [updated] = await query(
        "SELECT id, name, email, role, active, createdAt FROM AdminUser WHERE id = ? LIMIT 1",
        [body.id as string],
        connection,
      );
      return { kind: "updated" as const, user: updated };
    });
    if (outcome.kind === "missing") return jsonError("The administrator no longer exists.", 404);
    if (outcome.kind === "last-super-admin") return jsonError("The last active super administrator cannot be deactivated or demoted.", 409);
    return NextResponse.json({ user: outcome.user });
  } catch (error) {
    if (isDuplicateEntryError(error)) return jsonError("An account already uses that email address.", 409);
    return safeErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!assertSameOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  try {
    const actor = await getCurrentAdmin();
    if (actor?.role !== "SUPER_ADMIN") return jsonError("Only a super administrator can delete administrator accounts.", 403);
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 30) return jsonError("A valid administrator ID is required.", 400);
    if (id === actor.id) return jsonError("You cannot delete your own account.", 400);
    const outcome = await withTransaction(async connection => {
      const [target] = await query<AdminRow>(
        "SELECT id, name, email, role, active FROM AdminUser WHERE id = ? FOR UPDATE",
        [id],
        connection,
      );
      if (!target) return "missing";
      if (target.role === "SUPER_ADMIN" && target.active) {
        const [count] = await query<RowDataPacket & { total: number }>(
          "SELECT COUNT(*) AS total FROM AdminUser WHERE role = 'SUPER_ADMIN' AND active = 1",
          [],
          connection,
        );
        if (Number(count?.total ?? 0) <= 1) return "last-super-admin";
      }
      await execute("DELETE FROM AdminUser WHERE id = ?", [id], connection);
      await execute(
        "INSERT INTO AuditLog (id, userId, action, entity, entityId) VALUES (?, ?, 'ADMIN_DELETE', 'AdminUser', ?)",
        [createId(), actor.id, id],
        connection,
      );
      return "deleted";
    });
    if (outcome === "missing") return jsonError("The administrator no longer exists.", 404);
    if (outcome === "last-super-admin") return jsonError("The last active super administrator cannot be deleted.", 409);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
