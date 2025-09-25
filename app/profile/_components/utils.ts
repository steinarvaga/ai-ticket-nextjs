import type { Role } from "@/lib/types";

export function roleBadgeClass(role?: Role) {
  switch (role) {
    case "admin":
      return "badge-error";
    case "moderator":
      return "badge-warning";
    default:
      return "badge-info";
  }
}
