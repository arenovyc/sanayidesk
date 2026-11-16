export const MEMBERSHIP_ROLES = ["owner", "advisor", "mechanic", "apprentice"] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export function homeForRole(role: MembershipRole): string {
  if (role === "mechanic") return "/lift";
  if (role === "apprentice") return "/tasks";
  return "/today";
}

export function isDeskRole(role: MembershipRole) {
  return role === "owner" || role === "advisor";
}

export function isLiftRole(role: MembershipRole) {
  return role === "mechanic";
}

export function isCrewRole(role: MembershipRole) {
  return role === "apprentice";
}
