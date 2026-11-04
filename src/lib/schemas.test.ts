import { describe, expect, it } from "vitest";
import { articleSchema, contactSchema, publicationSchema, testimonialSchema, userCreateSchema } from "./schemas";
import { canManage } from "./permissions";

describe("public and administrator input validation", () => {
  it("rejects testimonial approval without publication consent", () => {
    const result = testimonialSchema.safeParse({
      quote: "A verified participant quote provided with written permission.",
      authorName: "Participant",
      authorRole: "Youth participant",
      category: "Youth",
      consentToPublish: false,
      approved: true,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a consented testimonial that is still awaiting approval", () => {
    const result = testimonialSchema.safeParse({
      quote: "A verified participant quote provided with written permission.",
      authorName: "Participant",
      authorRole: "Youth participant",
      category: "Youth",
      consentToPublish: true,
      approved: false,
    });

    expect(result.success).toBe(true);
  });

  it("normalizes contact email and rejects a filled honeypot", () => {
    const valid = contactSchema.safeParse({
      name: "Community Member",
      email: "  PERSON@example.org ",
      subject: "Partnership question",
      message: "I would like to learn about your current programs.",
      website: "",
    });
    const spam = contactSchema.safeParse({
      name: "Community Member",
      email: "person@example.org",
      subject: "Partnership question",
      message: "I would like to learn about your current programs.",
      website: "spam",
    });

    expect(valid.success).toBe(true);
    if (valid.success) expect(valid.data.email).toBe("person@example.org");
    expect(spam.success).toBe(false);
  });

  it("requires a long password before provisioning an administrator", () => {
    const result = userCreateSchema.safeParse({
      name: "YPP Administrator",
      email: "admin@example.org",
      password: "short",
      role: "ADMIN",
    });

    expect(result.success).toBe(false);
  });

  it("limits editorial roles to their authorized CMS resources", () => {
    const editor = { id: "editor-1", name: "Editor", email: "editor@example.org", role: "EDITOR" as const };

    expect(canManage(editor, "articles")).toBe(true);
    expect(canManage(editor, "team")).toBe(false);
    expect(canManage(editor, "contacts")).toBe(false);
  });

  it("only accepts HTTP(S) links for published content", () => {
    const publication = {
      title: "Annual report",
      category: "Reports",
      documentUrl: "javascript:alert(1)",
    };
    const article = {
      title: "Community update",
      slug: "community-update",
      summary: "A verified update about current YPP work.",
      body: "A longer verified update about current YPP work and its community context.",
      category: "News",
      featuredImageUrl: "javascript:alert(1)",
    };

    expect(publicationSchema.safeParse(publication).success).toBe(false);
    expect(articleSchema.safeParse(article).success).toBe(false);
  });
});
