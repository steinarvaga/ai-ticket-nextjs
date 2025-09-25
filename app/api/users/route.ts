import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import dbConnect from "@/utils/db";
import User from "@/models/user";
import { verifyJWT } from "@/lib/server/jwt";
import type { JWTPayload } from "jose";
import type { Role, User as IUser } from "@/lib/types";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type SanitizedUser = Omit<IUser, "password">;
type AppJWTPayload = JWTPayload & { sub?: string };

interface UserDoc {
  _id: unknown;
  name: string;
  email: string;
  role: Role;
  skills: string[];
}

export async function GET(_req: NextRequest) {
  try {
    await dbConnect();

    // Next 15: cookies() / headers() are async
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get("token")?.value;

    const hdrs = await headers();
    const tokenFromHeader = hdrs
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Your JWT only has { sub }, not role/email
    const decoded = (await verifyJWT(token)) as AppJWTPayload | false;
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Look up the current user by sub (id) to check role/email
    const me = await User.findById(decoded.sub)
      .select("email role")
      .lean<{ email: string; role: Role } | null>();
    if (!me) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (me.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden. Only admins can access user details." },
        { status: 403 }
      );
    }

    // Fetch other users (no password) and exclude the current user
    const docs = await User.find({}, "name email role skills").lean<
      UserDoc[]
    >();
    const users: SanitizedUser[] = docs
      .map((u) => ({
        _id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        skills: Array.isArray(u.skills) ? u.skills : [],
      }))
      .filter((u) => u.email !== me.email);

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
