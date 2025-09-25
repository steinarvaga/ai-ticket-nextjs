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

// payload we accept from Admin UI
interface UpdateBody {
  name?: string;
  role?: Role; // "user" | "moderator" | "admin"
  skills?: string[];
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

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

    // Your JWT contains only { sub }, not role/email
    const decoded = (await verifyJWT(token)) as AppJWTPayload | false;
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Load current user to verify admin role
    const me = await User.findById(decoded.sub)
      .select("role")
      .lean<{ role: Role } | null>();
    if (!me || me.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;

    // Parse & validate body
    const body = (await req.json()) as UpdateBody;
    const update: Partial<UpdateBody> = {};

    if (typeof body.name === "string" && body.name.trim().length > 0) {
      update.name = body.name.trim();
    }
    if (body.role && ["user", "moderator", "admin"].includes(body.role)) {
      update.role = body.role;
    }
    if (Array.isArray(body.skills)) {
      // normalize skills to trimmed strings
      update.skills = body.skills
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { message: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update and return sanitized document
    const doc = await User.findByIdAndUpdate(id, update, { new: true })
      .select("name email role skills") // never expose password
      .lean<{
        _id: unknown;
        name: string;
        email: string;
        role: Role;
        skills: string[];
      } | null>();

    if (!doc) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const user: SanitizedUser = {
      _id: String(doc._id),
      name: doc.name,
      email: doc.email,
      role: doc.role,
      skills: Array.isArray(doc.skills) ? doc.skills : [],
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
