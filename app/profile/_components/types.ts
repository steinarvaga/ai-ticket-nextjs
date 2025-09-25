import type { User } from "@/lib/types"; // Role, User from your shared types  :contentReference[oaicite:9]{index=9}

/** The page needs extended profile fields beyond AuthContext */
export type ProfileData = User & {
  skills: string[];
  createdAt?: string; // ISO
};

/** Update payload accepted by PUT /api/profile */
export type UpdatePayload = {
  name: string;
  email: string;
  skills: string[];

  // password branch (optional)
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};
