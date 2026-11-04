import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { destroyCurrentSession, getCurrentAdmin } from "@/lib/auth";
import { assertSameOrigin, jsonError, safeErrorResponse } from "@/lib/http";
import { execute } from "@/lib/db";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!assertSameOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  try {
    const user = await getCurrentAdmin();
    if (user) {
      await execute(
        "INSERT INTO AuditLog (id, userId, action, entity, entityId) VALUES (?, ?, 'AUTH_LOGOUT', 'AdminUser', ?)",
        [randomBytes(15).toString("base64url"), user.id, user.id],
      );
    }
    await destroyCurrentSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
