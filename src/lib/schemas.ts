import { z } from "zod";

const slug = z.string().trim().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const safeUrl = z.string().url().max(2048).refine(value => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "Use a secure HTTP or HTTPS URL.");
const optionalUrl = z.union([z.literal(""), safeUrl]).transform(value => value || null);
const words = z.array(z.string().trim().min(1).max(240)).max(30);
const publishStatus = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(1).max(200),
}).strict();

export const articleSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug,
  summary: z.string().trim().min(10).max(500),
  body: z.string().trim().min(10).max(100000),
  category: z.string().trim().min(2).max(80).refine(value => /[a-z0-9]/i.test(value), "Category must contain a letter or number."),
  featuredImageUrl: optionalUrl.optional(),
  seoTitle: z.string().trim().max(180).optional().nullable(),
  seoDescription: z.string().trim().max(320).optional().nullable(),
  featured: z.boolean().default(false),
  status: publishStatus.default("DRAFT"),
  publishAt: z.string().datetime().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
}).strict();

export const programSchema = z.object({
  title: z.string().trim().min(3).max(160), slug, description: z.string().trim().min(10).max(1000),
  objectives: words, activities: words, imageUrl: optionalUrl.optional(), status: publishStatus.default("DRAFT"),
  sortOrder: z.number().int().min(0).max(10000).default(0),
}).strict();

export const projectSchema = z.object({
  title: z.string().trim().min(3).max(180), slug, summary: z.string().trim().min(10).max(500),
  description: z.string().trim().min(10).max(100000), objectives: words, location: z.string().trim().min(2).max(180),
  status: publishStatus.default("DRAFT"), projectStatus: z.string().trim().min(2).max(60),
  imageUrl: optionalUrl.optional(), startsAt: z.string().datetime().optional().nullable(), endsAt: z.string().datetime().optional().nullable(),
  beneficiaries: z.string().trim().max(1000).optional().nullable(), verifiedResults: z.string().trim().max(100000).optional().nullable(),
  reportUrl: optionalUrl.optional(), programId: z.string().trim().max(30).optional().nullable(),
}).strict();

export const eventSchema = z.object({
  title: z.string().trim().min(3).max(180), slug, description: z.string().trim().min(10).max(100000),
  location: z.string().trim().min(2).max(180), startsAt: z.string().datetime(), endsAt: z.string().datetime().optional().nullable(),
  imageUrl: optionalUrl.optional(), status: publishStatus.default("DRAFT"),
}).strict();

export const gallerySchema = z.object({
  title: z.string().trim().min(3).max(160), caption: z.string().trim().max(500).optional().nullable(),
  altText: z.string().trim().min(5).max(300), category: z.string().trim().min(2).max(80),
  imageUrl: safeUrl, status: publishStatus.default("DRAFT"),
  sortOrder: z.number().int().min(0).max(10000).default(0),
}).strict();

export const teamSchema = z.object({
  name: z.string().trim().min(2).max(120), position: z.string().trim().min(2).max(140),
  biography: z.string().trim().min(10).max(1500), imageUrl: optionalUrl.optional(),
  status: publishStatus.default("DRAFT"), sortOrder: z.number().int().min(0).max(10000).default(0),
}).strict();

export const partnerSchema = z.object({
  name: z.string().trim().min(2).max(160), websiteUrl: optionalUrl.optional(),
  description: z.string().trim().max(1000).optional().nullable(), logoUrl: optionalUrl.optional(),
  status: publishStatus.default("DRAFT"),
}).strict();

export const publicationSchema = z.object({
  title: z.string().trim().min(3).max(180), description: z.string().trim().max(1000).optional().nullable(),
  category: z.string().trim().min(2).max(80), documentUrl: safeUrl,
  status: publishStatus.default("DRAFT"),
}).strict();

export const testimonialSchema = z.object({
  quote: z.string().trim().min(10).max(1500), authorName: z.string().trim().min(2).max(120),
  authorRole: z.string().trim().min(2).max(140), category: z.enum(["Youth", "Community member", "Partner"]),
  imageUrl: optionalUrl.optional(), consentToPublish: z.boolean(),
  approved: z.boolean().default(false),
}).strict().refine(value => !value.approved || value.consentToPublish, {
  message: "Written consent is required before a testimonial can be approved.",
  path: ["consentToPublish"],
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  phone: z.string().trim().max(40).optional().nullable(), subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(10).max(5000), website: z.string().max(0).optional(),
}).strict();

export const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(12).max(200), role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]), active: z.boolean().default(true),
}).strict();

export const userUpdateSchema = userCreateSchema.omit({ password: true }).extend({
  password: z.union([z.literal(""), z.string().min(12).max(200)]).optional(),
}).strict();

export const settingSchema = z.object({ key: z.string().trim().min(2).max(100), value: z.unknown() }).strict();
export const contactStatusSchema = z.object({ status: z.enum(["UNREAD", "READ", "REPLIED", "ARCHIVED"]) }).strict();
