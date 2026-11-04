import "server-only";

import { query } from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface SettingRow extends RowDataPacket {
  key: string;
  value: unknown;
}

interface ProgramRow extends RowDataPacket {
  id: string;
  title: string;
  slug: string;
  description: string;
  objectives: unknown;
  activities: unknown;
  imageUrl: string | null;
  status: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ArticleRow extends RowDataPacket {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
  featuredImageUrl: string | null;
  status: string;
  featured: number | boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  categoryCreatedAt: Date;
}

interface ProjectRow extends RowDataPacket {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  objectives: unknown;
  location: string;
  status: string;
  projectStatus: string;
  imageUrl: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  beneficiaries: string | null;
  verifiedResults: string | null;
  reportUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  programId: string | null;
  programTitle: string | null;
  programSlug: string | null;
}

interface PublicCardRow extends RowDataPacket {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  status?: string;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface GalleryRow extends PublicCardRow {
  altText: string;
  category: string;
  caption: string | null;
  imageUrl: string;
  sortOrder: number;
}

interface TeamRow extends RowDataPacket {
  id: string;
  name: string;
  position: string;
  biography: string;
  imageUrl: string | null;
  status: string;
  sortOrder: number;
}

interface PartnerRow extends RowDataPacket {
  id: string;
  name: string;
  websiteUrl: string | null;
  description: string | null;
  logoUrl: string | null;
  status: string;
}

interface PublicationRow extends RowDataPacket {
  id: string;
  title: string;
  description: string | null;
  category: string;
  documentUrl: string;
  status: string;
  publishedAt: Date | null;
}

interface CountRow extends RowDataPacket {
  count: number;
}

function jsonValue<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string") return (value as T | null) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeArticle(row: ArticleRow, tags: { id: string; name: string }[] = []) {
  const { categoryId, categoryName, categorySlug, categoryCreatedAt, ...article } = row;
  return {
    ...article,
    featured: Boolean(row.featured),
    category: { id: categoryId, name: categoryName, slug: categorySlug, createdAt: categoryCreatedAt },
    tags,
  };
}

async function articlesWithRelations(rows: ArticleRow[]) {
  if (!rows.length) return [];
  const ids = rows.map(row => row.id);
  const placeholders = ids.map(() => "?").join(", ");
  const tags = await query<RowDataPacket & { articleId: string; id: string; name: string }>(
    `SELECT relation.A AS articleId, tag.id, tag.name FROM _ArticleToArticleTag relation JOIN ArticleTag tag ON tag.id = relation.B WHERE relation.A IN (${placeholders}) ORDER BY tag.name`,
    ids,
  );
  const byArticle = new Map<string, { id: string; name: string }[]>();
  for (const tag of tags) {
    const list = byArticle.get(tag.articleId) ?? [];
    list.push({ id: tag.id, name: tag.name });
    byArticle.set(tag.articleId, list);
  }
  return rows.map(row => normalizeArticle(row, byArticle.get(row.id) ?? []));
}

const ARTICLE_SELECT = `SELECT a.*, c.name AS categoryName, c.slug AS categorySlug, c.createdAt AS categoryCreatedAt
  FROM Article a JOIN ArticleCategory c ON c.id = a.categoryId`;

const organizationDefaults = {
  email: "youthforpeace15@gmail.com",
  phone: "+252 612 029 321",
  location: "Southwest State of Somalia and Mogadishu, Somalia",
  mission: "Empower young people and communities through peacebuilding, leadership, capacity development, and inclusive initiatives.",
  vision: "A peaceful, inclusive, and prosperous society where young people actively contribute to peacebuilding and sustainable development.",
};

export async function publicOrganizationSettings() {
  const rows = await query<SettingRow>(
    "SELECT `key`, `value` FROM WebsiteSetting WHERE `key` IN (?, ?, ?, ?, ?)",
    ["contact.email", "contact.phone", "contact.location", "organization.mission", "organization.vision"],
  );
  const settings = new Map(rows.map(row => [row.key, jsonValue(row.value, "")]));
  const text = (key: string, fallback: string) => {
    const value = settings.get(key);
    return typeof value === "string" && value.trim() ? value : fallback;
  };
  return {
    email: text("contact.email", organizationDefaults.email),
    phone: text("contact.phone", organizationDefaults.phone),
    location: text("contact.location", organizationDefaults.location),
    mission: text("organization.mission", organizationDefaults.mission),
    vision: text("organization.vision", organizationDefaults.vision),
  };
}

export async function publishedPrograms() {
  const rows = await query<ProgramRow>("SELECT * FROM Program WHERE status = 'PUBLISHED' ORDER BY sortOrder ASC");
  return rows.map(row => ({
    ...row,
    objectives: jsonValue<JsonValue[]>(row.objectives, []),
    activities: jsonValue<JsonValue[]>(row.activities, []),
  }));
}

export async function publishedProgram(slug: string) {
  const [row] = await query<ProgramRow>(
    "SELECT * FROM Program WHERE slug = ? AND status = 'PUBLISHED' LIMIT 1",
    [slug],
  );
  if (!row) return null;
  return {
    ...row,
    objectives: jsonValue<JsonValue[]>(row.objectives, []),
    activities: jsonValue<JsonValue[]>(row.activities, []),
  };
}

export async function publishedHomeContent() {
  const [programs, countRows, projects, articleRows, photos] = await Promise.all([
    query<ProgramRow>("SELECT * FROM Program WHERE status = 'PUBLISHED' ORDER BY sortOrder ASC LIMIT 3"),
    query<CountRow>("SELECT COUNT(*) AS count FROM Program WHERE status = 'PUBLISHED'"),
    query<ProjectRow>("SELECT * FROM Project WHERE status = 'PUBLISHED' ORDER BY createdAt DESC LIMIT 3"),
    query<ArticleRow>(
      `${ARTICLE_SELECT} WHERE a.status = 'PUBLISHED' AND a.publishedAt <= NOW()
        ORDER BY a.publishedAt DESC, a.createdAt DESC LIMIT 3`,
    ),
    query<GalleryRow>("SELECT * FROM GalleryImage WHERE status = 'PUBLISHED' ORDER BY sortOrder ASC LIMIT 6"),
  ]);
  return {
    programs: programs.map(row => ({
      ...row,
      objectives: jsonValue<JsonValue[]>(row.objectives, []),
      activities: jsonValue<JsonValue[]>(row.activities, []),
    })),
    programCount: Number(countRows[0]?.count ?? 0),
    projects: projects.map(row => ({ ...row, objectives: jsonValue<JsonValue[]>(row.objectives, []) })),
    articles: await articlesWithRelations(articleRows),
    photos,
  };
}

export async function publishedProjects(search = "") {
  const term = search.trim().slice(0, 100);
  const like = `%${term}%`;
  const rows = await query<ProjectRow>(
    `SELECT p.*, program.title AS programTitle, program.slug AS programSlug
      FROM Project p LEFT JOIN Program program ON program.id = p.programId
      WHERE p.status = 'PUBLISHED' AND (? = '' OR p.title LIKE ? OR p.summary LIKE ? OR p.location LIKE ?)
      ORDER BY p.createdAt DESC`,
    [term, like, like, like],
  );
  return rows.map(row => ({
    ...row,
    objectives: jsonValue<JsonValue[]>(row.objectives, []),
    program: row.programId && row.programTitle && row.programSlug
      ? { title: row.programTitle, slug: row.programSlug }
      : null,
  }));
}

export async function publishedArticles(search = "", category = "") {
  const term = search.trim().slice(0, 100);
  const like = `%${term}%`;
  const rows = await query<ArticleRow>(
    `${ARTICLE_SELECT}
      WHERE a.status = 'PUBLISHED' AND a.publishedAt <= NOW()
        AND (? = '' OR c.slug = ?)
        AND (? = '' OR a.title LIKE ? OR a.summary LIKE ? OR a.body LIKE ?)
      ORDER BY a.publishedAt DESC, a.createdAt DESC LIMIT 100`,
    [category, category, term, like, like, like],
  );
  return articlesWithRelations(rows);
}

export async function publishedArticle(slug: string) {
  const rows = await query<ArticleRow>(
    `${ARTICLE_SELECT} WHERE a.slug = ? AND a.status = 'PUBLISHED' AND a.publishedAt <= NOW() LIMIT 1`,
    [slug],
  );
  return (await articlesWithRelations(rows))[0] ?? null;
}

export async function publishedProject(slug: string) {
  const [project] = await query<ProjectRow>(
    `SELECT p.*, program.title AS programTitle, program.slug AS programSlug
      FROM Project p LEFT JOIN Program program ON program.id = p.programId
      WHERE p.slug = ? AND p.status = 'PUBLISHED' LIMIT 1`,
    [slug],
  );
  if (!project) return null;
  return {
    ...project,
    objectives: jsonValue<JsonValue[]>(project.objectives, []),
    program: project.programId && project.programTitle && project.programSlug
      ? { title: project.programTitle, slug: project.programSlug }
      : null,
  };
}

export async function publishedEvents() {
  return query<PublicCardRow & { slug: string; startsAt: Date; location: string }>("SELECT * FROM Event WHERE status = 'PUBLISHED' AND startsAt >= CURRENT_DATE() ORDER BY startsAt ASC");
}

export async function publishedGallery() {
  return query<GalleryRow>("SELECT * FROM GalleryImage WHERE status = 'PUBLISHED' ORDER BY sortOrder ASC");
}

export async function publishedTeam() {
  const rows = await query<TeamRow>("SELECT * FROM TeamMember WHERE status = 'PUBLISHED' ORDER BY sortOrder ASC");
  return rows.map(row => ({ ...row, title: row.name }));
}

export async function publishedPartners() {
  const rows = await query<PartnerRow>("SELECT * FROM Partner WHERE status = 'PUBLISHED' ORDER BY name ASC");
  return rows.map(row => ({ ...row, title: row.name }));
}

export async function publishedReports() {
  return query<PublicationRow>("SELECT * FROM Publication WHERE status = 'PUBLISHED' AND publishedAt <= NOW() ORDER BY publishedAt DESC");
}

export async function publicTestimonials() {
  return query(
    "SELECT id, quote, authorName, authorRole, category, imageUrl FROM Testimonial WHERE approved = 1 AND consentToPublish = 1 ORDER BY createdAt DESC LIMIT 12",
  );
}
