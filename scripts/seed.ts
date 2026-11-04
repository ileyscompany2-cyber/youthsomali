import "dotenv/config";

import { readdir } from "node:fs/promises";
import path from "node:path";
import { closeDatabasePool, execute, withTransaction } from "../src/lib/db";

const programs = [
  ["community-peace-forums", "Community Peace Forums", "Community forums focused on dialogue, peacebuilding, and participation.", "/images/about-youth.jpg"],
  ["youth-forums-peace-security", "Youth Forums on Peace and Security", "Forums for young people to engage with peace and security issues.", "/images/gallery-02.jpg"],
  ["sports-peace-development", "Sports for Peace and Development", "Sports activities as an approach to peacebuilding and community development.", "/images/gallery-03.jpg"],
  ["peace-education-schools", "Peace Education in Schools", "Peace education activities for school communities.", "/images/project-education.jpg"],
  ["conflict-prevention-resolution", "Conflict Prevention and Resolution", "Initiatives focused on preventing and resolving conflict.", "/images/project-dialogue.jpg"],
  ["youth-leadership-peacebuilding", "Youth Leadership and Participation in Peacebuilding", "Youth leadership and participation in peacebuilding.", "/images/news-community.jpg"],
  ["dialogue-mediation-reconciliation", "Dialogue, Mediation and Reconciliation", "Dialogue, mediation, and reconciliation initiatives.", "/images/gallery-01.jpg"],
] as const;

const settings = [
  ["contact.email", "youthforpeace15@gmail.com"],
  ["contact.phone", "+252 612 029 321"],
  ["contact.location", "Southwest State of Somalia and Mogadishu, Somalia"],
  ["organization.founded", "5 February 2017"],
  ["organization.executiveDirector", "Ibrahim Aden Ali"],
  ["organization.mission", "Empower young people and communities through peacebuilding, leadership, capacity development, and inclusive initiatives."],
  ["organization.vision", "A peaceful, inclusive, and prosperous society where young people actively contribute to peacebuilding and sustainable development."],
] as const;

async function seed() {
  const photoDirectory = path.join(process.cwd(), "public", "images", "gallery");
  const photos = (await readdir(photoDirectory)).filter(file => /\.webp$/i.test(file)).sort();
  await withTransaction(async connection => {
    for (const [index, [slug, title, description, imageUrl]] of programs.entries()) {
      await execute(
        `INSERT INTO Program (id, title, slug, description, objectives, activities, imageUrl, status, sortOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, JSON_ARRAY(), JSON_ARRAY(), ?, 'PUBLISHED', ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
         ON DUPLICATE KEY UPDATE id = id`,
        [`program-${String(index + 1).padStart(2, "0")}`, title, slug, description, imageUrl, index],
        connection,
      );
    }

    await execute(
      `INSERT INTO TeamMember (id, name, position, biography, status, sortOrder, createdAt, updatedAt)
       VALUES ('ypp-executive-director', 'Ibrahim Aden Ali', 'Executive Director',
         'Executive Director of Youth for Peace and Prosperous (YPP).', 'PUBLISHED', 0,
         CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
       ON DUPLICATE KEY UPDATE id = id`,
      [],
      connection,
    );

    for (const [key, value] of settings) {
      await execute(
        "INSERT INTO WebsiteSetting (`key`, `value`, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE `key` = `key`",
        [key, JSON.stringify(value)],
        connection,
      );
    }

    for (const [index, file] of photos.entries()) {
      const photoNumber = index + 1;
      const id = `ypp-${path.parse(file).name.toLowerCase()}`;
      await execute(
        `INSERT INTO GalleryImage (id, title, altText, category, imageUrl, status, sortOrder, createdAt, updatedAt)
         VALUES (?, ?, ?, 'YPP community', ?, 'PUBLISHED', ?, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
         ON DUPLICATE KEY UPDATE id = id`,
        [
          id,
          `YPP community photograph ${photoNumber}`,
          `Youth for Peace and Prosperous community photograph ${photoNumber}`,
          `/images/gallery/${file}`,
          photoNumber,
        ],
        connection,
      );
    }
  });
  console.log(`Seeded baseline content: ${programs.length} programs, 1 verified team profile, ${settings.length} settings, and ${photos.length} bundled gallery records.`);
}

seed()
  .catch(error => {
    console.error("Could not seed verified YPP baseline content.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });
