import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { execute, query } from "@/lib/db";
import type { AdminRole } from "@/lib/db-types";
import type { RowDataPacket } from "mysql2/promise";

export const SESSION_COOKIE = "ypp_admin_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 12;

export type SafeAdmin = { id: string; name: string; email: string; role: AdminRole };

interface SessionRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: number;
  expiresAt: Date;
}

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  await execute("INSERT INTO AdminSession (id, tokenHash, userId, expiresAt) VALUES (?, ?, ?, ?)", [
    randomBytes(15).toString("base64url"),
    hash(token),
    userId,
    expiresAt,
  ]);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentAdmin(): Promise<SafeAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const [session] = await query<SessionRow>(
    "SELECT u.id, u.name, u.email, u.role, u.active, s.expiresAt FROM AdminSession s JOIN AdminUser u ON u.id = s.userId WHERE s.tokenHash = ? LIMIT 1",
    [hash(token)],
  );
  if (!session || session.expiresAt <= new Date() || !session.active) return null;
  return { id: session.id, name: session.name, email: session.email, role: session.role };
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && token.length <= 100) {
    await execute("DELETE FROM AdminSession WHERE tokenHash = ?", [hash(token)]);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export function hasRole(user: SafeAdmin, allowed: readonly AdminRole[]): boolean {
  return allowed.includes(user.role);
}

export function hashNetworkAddress(address: string): string {
  return hash(address);
}
