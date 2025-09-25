import "server-only";
import { verifyJWT } from "./jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/utils/db";
import User from "@/models/user";

/**
 * Redirects to `url` if there's no valid JWT token.
 */
export async function checkUnauthenticated(url: string = "/"): Promise<void> {
  await dbConnect();
  const cookieStore = await cookies(); // ← await here
  const token = cookieStore.get("token")?.value;
  if (!token) redirect(url);

  const payload = await verifyJWT(token);
  if (payload === false) redirect(url);
}

/**
 * Redirects to `url` if a valid JWT token _is_ present.
 */
export async function checkAuthenticated(
  url: string = "/login"
): Promise<void> {
  await dbConnect();
  const cookieStore = await cookies(); // ← await here
  const token = cookieStore.get("token")?.value;
  if (token) {
    const payload = await verifyJWT(token);
    if (payload !== false) redirect(url);
  }
}

/**
 * Returns the current user if the JWT is valid, or `null`.
 * Exposes: {_id, email, name, role, skills}
 */
export async function getAuthenticatedUser(): Promise<{
  _id: string;
  email: string;
  name: string;
  role: "user" | "moderator" | "admin";
  skills: string[];
} | null> {
  await dbConnect();
  const cookieStore = await cookies(); // ← await here
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload || !payload.sub) return null;

  const user = await User.findById(payload.sub).select("-password");
  if (!user) return null;

  return {
    _id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    skills: user.skills,
  };
}
