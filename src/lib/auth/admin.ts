import { siteConfig } from "@/config/site";

export function getAllowedAdminEmails() {
  const envValue = process.env.ALLOWED_ADMIN_EMAILS;

  if (!envValue) {
    return [...siteConfig.adminEmails];
  }

  return envValue
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getAllowedAdminEmails().includes(email.toLowerCase());
}
