import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { z } from "zod";

import User from "@/models/user";
import dbConnect from "@/utils/db";
import { getAuthenticatedUser } from "@/lib/server/auth";
import type { User as PublicUser, Role } from "@/lib/types";

// --------------------
// Validation Schema
// --------------------
const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  skills: z.array(z.string()).default([]),

  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .optional(),
  confirmPassword: z.string().optional(),
});

type UpdatePayload = z.infer<typeof updateProfileSchema>;

// --------------------
// Lean user shape we read from Mongo (sans password)
// --------------------
type UserLean = {
  _id: unknown; // ObjectId | string — we stringify it anyway
  name: string;
  email: string;
  role: Role;
  skills?: string[];
  createdAt?: string | Date;
};

// --------------------
// Helpers
// --------------------
function toPublicUser(doc: unknown): PublicUser {
  const u = doc as UserLean;
  return {
    _id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    skills: Array.isArray(u.skills) ? u.skills : [],
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : undefined,
  };
}

// --------------------
// GET /api/profile
// --------------------
export async function GET(_req: NextRequest) {
  await dbConnect();
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ authUser: null });
  }

  const user = await User.findById(authUser._id).select("-password").lean();
  if (!user) {
    return NextResponse.json({ authUser: null });
  }

  return NextResponse.json({ authUser: toPublicUser(user) });
}

// --------------------
// PUT /api/profile
// --------------------
export async function PUT(req: NextRequest) {
  await dbConnect();
  const authUser = await getAuthenticatedUser();
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let body: UpdatePayload;
  try {
    const json = await req.json();
    body = updateProfileSchema.parse(json);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      const errors = err.issues.map((i) => ({
        path: i.path.join("."), // e.g. "email" or "password.confirm"
        code: i.code, // e.g. "invalid_type", "too_small"
        message: i.message, // your custom or built-in message
      }));
      return NextResponse.json(
        { message: "Validation failed", errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, skills, currentPassword, newPassword, confirmPassword } =
    body;

  const user = await User.findById(authUser._id);
  if (!user) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  // Password change branch
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { message: "Current password is required to change password." },
        { status: 400 }
      );
    }
    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 400 }
      );
    }
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return NextResponse.json(
        { message: "New passwords do not match." },
        { status: 400 }
      );
    }
  }

  // Email uniqueness (case-insensitive)
  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { message: "Email already exists." },
        { status: 400 }
      );
    }
  }

  // Build update
  const updateData: Record<string, unknown> = {
    name,
    email: email.toLowerCase(),
    skills: Array.from(new Set(skills.map((s) => s.trim()).filter(Boolean))),
  };

  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const updated = await User.findByIdAndUpdate(authUser._id, updateData, {
    new: true,
  })
    .select("-password")
    .lean();

  if (!updated) {
    return NextResponse.json(
      { message: "Profile update failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully.",
    authUser: toPublicUser(updated),
  });
}
