import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { query } from "@/lib/db";
import { jsonError, safeErrorResponse } from "@/lib/http";
import { canManage } from "@/lib/permissions";
import type { RowDataPacket } from "mysql2/promise";

type RouteContext = { params: Promise<{ resource: string; id: string }> };
type ExportConfig = { table: string; orderBy: string };

const exports: Record<string, ExportConfig> = {
  articles: { table: "Article", orderBy: "createdAt ASC" },
  programs: { table: "Program", orderBy: "createdAt ASC" },
  projects: { table: "Project", orderBy: "createdAt ASC" },
  events: { table: "Event", orderBy: "createdAt ASC" },
  gallery: { table: "GalleryImage", orderBy: "createdAt ASC" },
  team: { table: "TeamMember", orderBy: "createdAt ASC" },
  partners: { table: "Partner", orderBy: "createdAt ASC" },
  publications: { table: "Publication", orderBy: "createdAt ASC" },
  testimonials: { table: "Testimonial", orderBy: "createdAt ASC" },
};

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const user = await getCurrentAdmin();
    const { resource, id } = await context.params;
    if (!user || !canManage(user, resource)) return jsonError("You are not authorized to view these records.", 403);
    if (resource === "contacts") return jsonError("Contact messages cannot be exported in aggregate.", 403);
    if (resource === "settings") return jsonError("Settings export is not available.", 403);
    const config = exports[resource];
    if (!config) return jsonError("Unknown content resource.", 404);
    if (id !== "export") return jsonError("Record details are available in the CMS list.", 404);
    const search = new URL(request.url).searchParams;
    const rawOffset = Number(search.get("offset") ?? 0);
    const rawLimit = Number(search.get("limit") ?? 25);
    if (!Number.isSafeInteger(rawOffset) || rawOffset < 0 || rawOffset > 1000000) return jsonError("Choose a valid export offset.", 400);
    if (!Number.isSafeInteger(rawLimit) || rawLimit < 1 || rawLimit > 250) return jsonError("Export pages must contain between 1 and 250 records.", 400);
    const [totals, records] = await Promise.all([
      query<RowDataPacket & { total: number }>(`SELECT COUNT(*) AS total FROM \`${config.table}\``),
      query(`SELECT * FROM \`${config.table}\` ORDER BY ${config.orderBy} LIMIT ? OFFSET ?`, [rawLimit, rawOffset]),
    ]);
    const { writeCsv } = await import("@/lib/export");
    const csv = writeCsv(records);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ypp-${resource}.csv"`,
        "Cache-Control": "no-store",
        "X-Export-Count": String(records.length),
        "X-Export-Total": String(Number(totals[0]?.total ?? 0)),
      },
    });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
