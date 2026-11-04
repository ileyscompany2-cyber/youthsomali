import type { AdminRole } from "@/lib/db-types";
import type { SafeAdmin } from "@/lib/auth";

const permissions: Record<string, readonly AdminRole[]> = {
  articles: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  programs: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  projects: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  events: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  gallery: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  team: ["SUPER_ADMIN", "ADMIN"],
  partners: ["SUPER_ADMIN", "ADMIN"],
  publications: ["SUPER_ADMIN", "ADMIN", "EDITOR"],
  testimonials: ["SUPER_ADMIN", "ADMIN"],
  contacts: ["SUPER_ADMIN", "ADMIN"],
  users: ["SUPER_ADMIN"],
  settings: ["SUPER_ADMIN", "ADMIN"],
};

export function canManage(user: SafeAdmin, resource: string): boolean {
  return permissions[resource]?.includes(user.role) ?? false;
}

export function canManageUsers(user: SafeAdmin): boolean {
  return user.role === "SUPER_ADMIN";
}
