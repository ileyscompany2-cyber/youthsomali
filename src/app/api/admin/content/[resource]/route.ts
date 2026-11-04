import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { canManage } from "@/lib/permissions";
import { assertSameOrigin, jsonError, safeErrorResponse } from "@/lib/http";
import { execute, isDuplicateEntryError, query, withTransaction } from "@/lib/db";
import type { AdminRole, ContactStatus, PublishStatus } from "@/lib/db-types";
import type { ExecuteValues, PoolConnection, RowDataPacket } from "mysql2/promise";
import {
  articleSchema,
  contactStatusSchema,
  eventSchema,
  gallerySchema,
  partnerSchema,
  programSchema,
  projectSchema,
  publicationSchema,
  settingSchema,
  teamSchema,
  testimonialSchema,
} from "@/lib/schemas";

type RouteContext = { params: Promise<{ resource: string }> };
type ResourceConfig = {
  table: string;
  schema: z.ZodType;
  searchable: readonly string[];
  orderBy: string;
  columns: readonly string[];
};
type Data = Record<string, unknown>;

const configs: Record<string, ResourceConfig> = {
  articles: {
    table: "Article", schema: articleSchema, searchable: ["title", "summary", "body"],
    orderBy: "a.publishedAt DESC, a.createdAt DESC",
    columns: ["title", "slug", "summary", "body", "seoTitle", "seoDescription", "featuredImageUrl", "featured", "status"],
  },
  programs: {
    table: "Program", schema: programSchema, searchable: ["title", "description"], orderBy: "sortOrder ASC",
    columns: ["title", "slug", "description", "objectives", "activities", "imageUrl", "status", "sortOrder"],
  },
  projects: {
    table: "Project", schema: projectSchema, searchable: ["title", "summary", "location"], orderBy: "createdAt DESC",
    columns: ["title", "slug", "summary", "description", "objectives", "location", "status", "projectStatus", "imageUrl", "startsAt", "endsAt", "beneficiaries", "verifiedResults", "reportUrl", "programId"],
  },
  events: {
    table: "Event", schema: eventSchema, searchable: ["title", "description", "location"], orderBy: "startsAt ASC",
    columns: ["title", "slug", "description", "location", "startsAt", "endsAt", "imageUrl", "status"],
  },
  gallery: {
    table: "GalleryImage", schema: gallerySchema, searchable: ["title", "caption", "category"], orderBy: "sortOrder ASC",
    columns: ["title", "caption", "altText", "category", "imageUrl", "status", "sortOrder"],
  },
  team: {
    table: "TeamMember", schema: teamSchema, searchable: ["name", "position", "biography"], orderBy: "sortOrder ASC",
    columns: ["name", "position", "biography", "imageUrl", "status", "sortOrder"],
  },
  partners: {
    table: "Partner", schema: partnerSchema, searchable: ["name", "description"], orderBy: "name ASC",
    columns: ["name", "websiteUrl", "description", "logoUrl", "status"],
  },
  publications: {
    table: "Publication", schema: publicationSchema, searchable: ["title", "description", "category"], orderBy: "publishedAt DESC",
    columns: ["title", "description", "category", "documentUrl", "status"],
  },
  testimonials: {
    table: "Testimonial", schema: testimonialSchema, searchable: ["quote", "authorName", "authorRole", "category"], orderBy: "createdAt DESC",
    columns: ["quote", "authorName", "authorRole", "category", "imageUrl", "consentToPublish", "approved"],
  },
  settings: {
    table: "WebsiteSetting", schema: settingSchema, searchable: ["`key`"], orderBy: "`key` ASC",
    columns: ["key", "value"],
  },
};

const publishStatuses: readonly PublishStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const contactStatuses: readonly ContactStatus[] = ["UNREAD", "READ", "REPLIED", "ARCHIVED"];
const id = () => randomBytes(15).toString("base64url");
const jsonColumns = new Set(["objectives", "activities", "value"]);
const dateColumns = new Set(["startsAt", "endsAt", "publishedAt"]);

function canChange(userRole: AdminRole, resource: string, method: string): boolean {
  if (resource === "contacts") return userRole !== "EDITOR";
  if (resource === "users") return userRole === "SUPER_ADMIN";
  if (resource === "settings" && method === "DELETE") return userRole === "SUPER_ADMIN";
  return canManage({ id: "", name: "", email: "", role: userRole }, resource);
}

async function actorAndResource(request: NextRequest, resource: string, method: string) {
  if (!["GET", "HEAD"].includes(method) && !assertSameOrigin(request)) {
    return { response: jsonError("Request origin could not be verified.", 403), user: undefined };
  }
  const user = await getCurrentAdmin();
  if (!user || !canChange(user.role, resource, method)) {
    return { response: jsonError("You are not authorized to manage this resource.", 403), user: undefined };
  }
  return { response: undefined, user };
}

function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}

function toDatabaseValue(column: string, value: unknown): ExecuteValues {
  if (value === undefined) return null;
  if (jsonColumns.has(column)) return JSON.stringify(value);
  if (dateColumns.has(column) && typeof value === "string") return value ? new Date(value) : null;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value instanceof Date) return value;
  throw new TypeError(`Unsupported SQL value for ${column}.`);
}

function decodeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeRow(resource: string, row: RowDataPacket): Record<string, unknown> {
  const item = { ...row } as Record<string, unknown>;
  for (const column of jsonColumns) {
    if (column in item) item[column] = decodeJson(item[column]);
  }
  if ("featured" in item) item.featured = Boolean(item.featured);
  if ("approved" in item) item.approved = Boolean(item.approved);
  if ("consentToPublish" in item) item.consentToPublish = Boolean(item.consentToPublish);
  if (resource === "projects") {
    const { programTitle, programSlug, ...project } = item;
    project.program = item.programId && programTitle && programSlug ? { title: programTitle, slug: programSlug } : null;
    return project;
  }
  if (resource === "articles") {
    const { categoryName, categorySlug, categoryCreatedAt, ...article } = item;
    article.category = {
      id: item.categoryId,
      name: categoryName,
      slug: categorySlug,
      createdAt: categoryCreatedAt,
    };
    return article;
  }
  return item;
}

async function readRows(
  resource: string,
  rows: RowDataPacket[],
  connection?: PoolConnection,
  publicRequest = false,
) {
  const items = rows.map(row => normalizeRow(resource, row));
  if (resource === "articles" && items.length) {
    const articleIds = items.map(item => String(item.id));
    const tagRows = await query<RowDataPacket & { articleId: string; id: string; name: string }>(
      `SELECT relation.A AS articleId, tag.id, tag.name FROM _ArticleToArticleTag relation
        JOIN ArticleTag tag ON tag.id = relation.B WHERE relation.A IN (${placeholders(articleIds.length)})
        ORDER BY tag.name`,
      articleIds,
      connection,
    );
    const tagsByArticle = new Map<string, { id: string; name: string }[]>();
    for (const tag of tagRows) {
      const tags = tagsByArticle.get(tag.articleId) ?? [];
      tags.push({ id: tag.id, name: tag.name });
      tagsByArticle.set(tag.articleId, tags);
    }
    for (const item of items) item.tags = tagsByArticle.get(String(item.id)) ?? [];
  }
  if (resource === "settings") {
    for (const item of items) item.value = decodeJson(item.value);
  }
  if (publicRequest && resource === "testimonials") {
    return items.map(({ id, quote, authorName, authorRole, category, imageUrl }) => ({ id, quote, authorName, authorRole, category, imageUrl }));
  }
  return items;
}

function selectSql(resource: string, config: ResourceConfig): string {
  if (resource === "articles") {
    return `SELECT a.*, c.name AS categoryName, c.slug AS categorySlug, c.createdAt AS categoryCreatedAt
      FROM Article a JOIN ArticleCategory c ON c.id = a.categoryId`;
  }
  if (resource === "projects") {
    return `SELECT p.*, program.title AS programTitle, program.slug AS programSlug
      FROM Project p LEFT JOIN Program program ON program.id = p.programId`;
  }
  return `SELECT * FROM \`${config.table}\``;
}

async function recordAudit(
  connection: PoolConnection,
  userId: string,
  action: string,
  entity: string,
  entityId?: string,
) {
  await execute(
    "INSERT INTO AuditLog (id, userId, action, entity, entityId) VALUES (?, ?, ?, ?, ?)",
    [id(), userId, action, entity, entityId ?? null],
    connection,
  );
}

function categorySlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

async function saveArticleTags(connection: PoolConnection, articleId: string, names: string[]) {
  for (const name of names) {
    const tagId = id();
    await execute("INSERT INTO ArticleTag (id, name) VALUES (?, ?) ON DUPLICATE KEY UPDATE id = id", [tagId, name], connection);
    const [tag] = await query<RowDataPacket & { id: string }>("SELECT id FROM ArticleTag WHERE name = ? LIMIT 1", [name], connection);
    if (tag) {
      await execute(
        "INSERT IGNORE INTO _ArticleToArticleTag (A, B) VALUES (?, ?)",
        [articleId, tag.id],
        connection,
      );
    }
  }
}

async function articleCategory(connection: PoolConnection, name: string): Promise<string> {
  const slug = categorySlug(name);
  await execute(
    "INSERT INTO ArticleCategory (id, name, slug) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE slug = VALUES(slug)",
    [id(), name, slug],
    connection,
  );
  const [category] = await query<RowDataPacket & { id: string }>(
    "SELECT id FROM ArticleCategory WHERE slug = ? LIMIT 1",
    [slug],
    connection,
  );
  if (!category) throw new Error("Article category could not be saved.");
  return category.id;
}

async function fetchItem(resource: string, config: ResourceConfig, itemId: string, connection: PoolConnection) {
  const sql = selectSql(resource, config);
  const alias = resource === "articles" ? "a" : resource === "projects" ? "p" : `\`${config.table}\``;
  const rows = await query(`${sql} WHERE ${alias}.id = ? LIMIT 1`, [itemId], connection);
  return (await readRows(resource, rows, connection))[0] ?? null;
}

async function saveRecord(
  resource: string,
  config: ResourceConfig,
  data: Data,
  userId: string,
  existingId?: string,
) {
  return withTransaction(async connection => {
    let itemId = existingId;
    if (resource === "settings") {
      const key = String(data.key);
      const value = JSON.stringify(data.value ?? null);
      await execute(
        "INSERT INTO WebsiteSetting (`key`, `value`, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updatedAt = CURRENT_TIMESTAMP(3)",
        [key, value],
        connection,
      );
      itemId = key;
    } else if (resource === "articles") {
      const categoryId = await articleCategory(connection, String(data.category));
      const articleData: Record<string, unknown> = {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        body: data.body,
        categoryId,
        featuredImageUrl: data.featuredImageUrl ?? null,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        featured: data.featured,
        status: data.status,
        publishedAt: data.status === "PUBLISHED"
          ? (typeof data.publishAt === "string" ? new Date(data.publishAt) : undefined)
          : null,
      };
      if (existingId) {
        const [previous] = await query<RowDataPacket & { publishedAt: Date | null }>(
          "SELECT publishedAt FROM Article WHERE id = ? LIMIT 1",
          [existingId],
          connection,
        );
        if (!previous) throw new Error("RECORD_NOT_FOUND");
        if (data.status === "PUBLISHED" && !articleData.publishedAt) articleData.publishedAt = previous.publishedAt ?? new Date();
        await execute(
          `UPDATE Article SET ${Object.keys(articleData).map(column => `\`${column}\` = ?`).join(", ")}, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
          [...Object.entries(articleData).map(([column, value]) => toDatabaseValue(column, value)), existingId],
          connection,
        );
        await execute("DELETE FROM _ArticleToArticleTag WHERE A = ?", [existingId], connection);
        itemId = existingId;
      } else {
        itemId = id();
        if (data.status === "PUBLISHED" && !articleData.publishedAt) articleData.publishedAt = new Date();
        const columns = ["id", ...Object.keys(articleData), "createdAt", "updatedAt"];
        const values = [itemId, ...Object.entries(articleData).map(([column, value]) => toDatabaseValue(column, value)), new Date(), new Date()];
        await execute(
          `INSERT INTO Article (${columns.map(column => `\`${column}\``).join(", ")}) VALUES (${placeholders(columns.length)})`,
          values,
          connection,
        );
      }
      await saveArticleTags(connection, itemId, Array.isArray(data.tags) ? data.tags.map(String) : []);
    } else {
      const columns = config.columns.filter(column => column in data);
      const values = columns.map(column => toDatabaseValue(column, data[column]));
      if (resource === "publications" && data.status === "PUBLISHED" && !existingId) {
        columns.push("publishedAt");
        values.push(new Date());
      }
      if (existingId) {
        const [current] = await query<RowDataPacket & { id: string }>(
          `SELECT id FROM \`${config.table}\` WHERE id = ? LIMIT 1`,
          [existingId],
          connection,
        );
        if (!current) throw new Error("RECORD_NOT_FOUND");
        if (columns.length) {
          await execute(
            `UPDATE \`${config.table}\` SET ${columns.map(column => `\`${column}\` = ?`).join(", ")}, updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
            [...values, existingId],
            connection,
          );
        } else {
          await execute(`UPDATE \`${config.table}\` SET updatedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`, [existingId], connection);
        }
        itemId = existingId;
      } else {
        itemId = id();
        const allColumns = ["id", ...columns, "createdAt", "updatedAt"];
        await execute(
          `INSERT INTO \`${config.table}\` (${allColumns.map(column => `\`${column}\``).join(", ")}) VALUES (${placeholders(allColumns.length)})`,
          [itemId, ...values, new Date(), new Date()],
          connection,
        );
      }
    }
    if (!itemId) throw new Error("Record could not be saved.");
    const item = resource === "settings"
      ? (await query(`SELECT * FROM WebsiteSetting WHERE \`key\` = ? LIMIT 1`, [itemId], connection))[0]
      : await fetchItem(resource, config, itemId, connection);
    if (!item) throw new Error("Saved record could not be reloaded.");
    await recordAudit(connection, userId, existingId ? "CONTENT_UPDATE" : "CONTENT_CREATE", resource, itemId);
    return item;
  });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { resource } = await context.params;
    if (resource === "contacts") {
      const { response } = await actorAndResource(request, resource, "GET");
      if (response) return response;
      const search = new URL(request.url).searchParams;
      const page = Number(search.get("page") ?? 1);
      if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return jsonError("Choose a valid page number.", 400);
      const status = search.get("status");
      if (status && !contactStatuses.includes(status as ContactStatus)) return jsonError("Choose a valid message status.", 400);
      const term = search.get("q")?.trim().slice(0, 100) ?? "";
      const clauses: string[] = [];
      const values: ExecuteValues[] = [];
      if (status) { clauses.push("status = ?"); values.push(status); }
      if (term) {
        clauses.push("(name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)");
        values.push(...Array(4).fill(`%${term}%`));
      }
      const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
      const [items, totals] = await Promise.all([
        query(`SELECT * FROM ContactMessage ${where} ORDER BY createdAt DESC LIMIT 25 OFFSET ?`, [...values, (page - 1) * 25]),
        query<RowDataPacket & { total: number }>(`SELECT COUNT(*) AS total FROM ContactMessage ${where}`, values),
      ]);
      return NextResponse.json({ items, page, total: Number(totals[0]?.total ?? 0), pageSize: 25 });
    }

    const config = configs[resource];
    if (!config) return jsonError("Unknown content resource.", 404);
    const access = await actorAndResource(request, resource, "GET");
    const publicRequest = resource !== "settings" && !access.user;
    if (resource === "settings" && access.response) return access.response;
    if (access.response && !publicRequest) return access.response;

    const search = new URL(request.url).searchParams;
    const page = Number(search.get("page") ?? 1);
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000) return jsonError("Choose a valid page number.", 400);
    const term = search.get("q")?.trim().slice(0, 100) ?? "";
    const clauses: string[] = [];
    const values: ExecuteValues[] = [];
    if (publicRequest) {
      if (resource === "testimonials") clauses.push("approved = 1 AND consentToPublish = 1");
      else {
        const statusAlias = resource === "articles" ? "a.status" : resource === "projects" ? "p.status" : "status";
        clauses.push(`${statusAlias} = 'PUBLISHED'`);
      }
      if (resource === "articles") clauses.push("a.publishedAt <= NOW()");
      if (resource === "publications") clauses.push("publishedAt <= NOW()");
    } else if (search.get("status")) {
      const status = search.get("status");
      if (!publishStatuses.includes(status as PublishStatus)) return jsonError("Invalid publication status.", 400);
      clauses.push("status = ?");
      values.push(status);
    }
    if (term && config.searchable.length) {
      clauses.push(`(${config.searchable.map(field => `${field} LIKE ?`).join(" OR ")})`);
      values.push(...config.searchable.map(() => `%${term}%`));
    }
    const select = selectSql(resource, config);
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const countTable = resource === "articles" ? "Article a" : resource === "projects" ? "Project p" : `\`${config.table}\``;
    const [rows, totals] = await Promise.all([
      query(`${select} ${where} ORDER BY ${config.orderBy} LIMIT 25 OFFSET ?`, [...values, (page - 1) * 25]),
      query<RowDataPacket & { total: number }>(`SELECT COUNT(*) AS total FROM ${countTable} ${where}`, values),
    ]);
    const items = await readRows(resource, rows, undefined, publicRequest);
    return NextResponse.json({ items, page, total: Number(totals[0]?.total ?? 0), pageSize: 25 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { resource } = await context.params;
    const config = configs[resource];
    if (!config) return jsonError("Unknown content resource.", 404);
    const { response, user } = await actorAndResource(request, resource, "POST");
    if (response || !user) return response ?? jsonError("Authentication is required.", 401);
    const parsed = config.schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Review the content fields and try again.", fields: z.flattenError(parsed.error) }, { status: 400 });
    const item = await saveRecord(resource, config, parsed.data as Data, user.id);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (isDuplicateEntryError(error)) return jsonError("A record with the same unique value already exists.", 409);
    return safeErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { resource } = await context.params;
    const { response, user } = await actorAndResource(request, resource, "PATCH");
    if (response || !user) return response ?? jsonError("Authentication is required.", 401);
    const body = await request.json().catch(() => null) as { id?: unknown; data?: unknown } | null;
    if (!body || typeof body.id !== "string" || body.id.length > 30) return jsonError("A valid record ID is required.", 400);
    if (resource === "contacts") {
      const parsed = contactStatusSchema.safeParse(body.data);
      if (!parsed.success) return jsonError("Choose a valid message status.", 400);
      const result = await withTransaction(async connection => {
        const update = await execute("UPDATE ContactMessage SET status = ? WHERE id = ?", [parsed.data.status, body.id as string], connection);
        if (!update.affectedRows) throw new Error("RECORD_NOT_FOUND");
        await recordAudit(connection, user.id, "CONTACT_STATUS", "ContactMessage", body.id as string);
        const [item] = await query("SELECT * FROM ContactMessage WHERE id = ? LIMIT 1", [body.id as string], connection);
        return item;
      });
      return NextResponse.json({ item: result });
    }
    const config = configs[resource];
    if (!config) return jsonError("Unknown content resource.", 404);
    const parsed = config.schema.safeParse(body.data);
    if (!parsed.success) return NextResponse.json({ error: "Review the content fields and try again.", fields: z.flattenError(parsed.error) }, { status: 400 });
    const data = parsed.data as Data;
    let approvalReset = false;
    if (resource === "testimonials") {
      const [current] = await query<RowDataPacket & Record<string, unknown>>(
        "SELECT quote, authorName, authorRole, category, imageUrl FROM Testimonial WHERE id = ? LIMIT 1",
        [body.id],
      );
      if (!current) return jsonError("The record no longer exists.", 404);
      approvalReset = (["quote", "authorName", "authorRole", "category", "imageUrl"] as const)
        .some(field => data[field] !== current[field]);
      if (approvalReset) {
        data.consentToPublish = false;
        data.approved = false;
      }
    }
    const item = await saveRecord(resource, config, data, user.id, body.id);
    return NextResponse.json({ item, ...(resource === "testimonials" ? { approvalReset } : {}) });
  } catch (error) {
    if (error instanceof Error && error.message === "RECORD_NOT_FOUND") return jsonError("The record no longer exists.", 404);
    if (isDuplicateEntryError(error)) return jsonError("A record with the same unique value already exists.", 409);
    return safeErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { resource } = await context.params;
    const { response, user } = await actorAndResource(request, resource, "DELETE");
    if (response || !user) return response ?? jsonError("Authentication is required.", 401);
    const search = new URL(request.url).searchParams;
    if (resource === "contacts") {
      const messageId = search.get("id");
      if (!messageId || messageId.length > 30) return jsonError("A valid message ID is required.", 400);
      await withTransaction(async connection => {
        const deleted = await execute("DELETE FROM ContactMessage WHERE id = ?", [messageId], connection);
        if (!deleted.affectedRows) throw new Error("RECORD_NOT_FOUND");
        await recordAudit(connection, user.id, "CONTACT_DELETE", "ContactMessage", messageId);
      });
      return NextResponse.json({ ok: true });
    }
    if (resource === "settings") {
      const key = search.get("id");
      if (!key || key.length > 100) return jsonError("A valid settings key is required.", 400);
      await withTransaction(async connection => {
        const deleted = await execute("DELETE FROM WebsiteSetting WHERE `key` = ?", [key], connection);
        if (!deleted.affectedRows) throw new Error("RECORD_NOT_FOUND");
        await recordAudit(connection, user.id, "CONTENT_DELETE", resource, key);
      });
      return NextResponse.json({ ok: true });
    }
    const config = configs[resource];
    if (!config) return jsonError("Unknown content resource.", 404);
    const recordId = search.get("id");
    if (!recordId || recordId.length > 30) return jsonError("A valid record ID is required.", 400);
    await withTransaction(async connection => {
      const deleted = await execute(`DELETE FROM \`${config.table}\` WHERE id = ?`, [recordId], connection);
      if (!deleted.affectedRows) throw new Error("RECORD_NOT_FOUND");
      await recordAudit(connection, user.id, "CONTENT_DELETE", resource, recordId);
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "RECORD_NOT_FOUND") return jsonError("The record no longer exists.", 404);
    return safeErrorResponse(error);
  }
}
