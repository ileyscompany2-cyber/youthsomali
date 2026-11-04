import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { execute, query, withTransaction } from "@/lib/db";
import { assertSameOrigin, getClientAddress, jsonError, safeErrorResponse } from "@/lib/http";
import { contactSchema } from "@/lib/schemas";
import type { RowDataPacket } from "mysql2/promise";

const CONTACT_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

interface RateLimitRow extends RowDataPacket {
  count: number;
  windowStart: Date;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!assertSameOrigin(request)) return jsonError("Request origin could not be verified.", 403);
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Review the form fields and try again.", fields: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const addressHash = createHash("sha256").update(getClientAddress(request)).digest("hex");
  const now = new Date();
  try {
    const allowed = await withTransaction(async connection => {
      await execute(
        `INSERT INTO ContactRateLimit (addressHash, count, windowStart) VALUES (?, 1, ?)
         ON DUPLICATE KEY UPDATE
           count = IF(windowStart < DATE_SUB(NOW(3), INTERVAL 1 HOUR), 1, count + 1),
           windowStart = IF(windowStart < DATE_SUB(NOW(3), INTERVAL 1 HOUR), NOW(3), windowStart)`,
        [addressHash, now],
        connection,
      );
      const [limit] = await query<RateLimitRow>(
        "SELECT count, windowStart FROM ContactRateLimit WHERE addressHash = ? LIMIT 1",
        [addressHash],
        connection,
      );
      if (!limit || (now.getTime() - limit.windowStart.getTime() < WINDOW_MS && limit.count > CONTACT_LIMIT)) return false;
      await execute(
        "INSERT INTO ContactMessage (id, name, email, phone, subject, message, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, 'UNREAD', CURRENT_TIMESTAMP(3))",
        [randomBytes(15).toString("base64url"), parsed.data.name, parsed.data.email, parsed.data.phone || null, parsed.data.subject, parsed.data.message],
        connection,
      );
      return true;
    });
    if (!allowed) return jsonError("Too many messages were sent from this connection. Please try again later.", 429);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
