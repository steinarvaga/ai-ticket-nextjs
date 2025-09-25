import { z } from "zod";
import bcrypt from "bcrypt";
import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import User from "@/models/user";
import { signJWT } from "@/lib/server/jwt";
import dbConnect from "@/utils/db";

const schema = z.object({
  email: z.string(),
  password: z.string().min(3),
  remember: z
    .string()
    .transform((val) => val === "on")
    .catch(false),
});

export async function POST(request: Request) {
  await dbConnect(); // ensure DB is connected

  const formData = await request.formData();
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember"),
  });

  if (!parsed.success) {
    return Response.json({ success: false, error: "Invalid input" });
  }

  const { email, password, remember } = parsed.data;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return Response.json({ success: false, error: "Invalid credentials" });
  }

  // User exists and password is correct -> issue JWT
  const token = await signJWT(
    { sub: user._id.toString() }, // use MongoDB ObjectId as sub
    { exp: remember ? "7d" : "1d" }
  );

  // Set token as HttpOnly cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", token, {
    path: "/",
    domain: process.env.APP_HOST || "",
    secure: true,
    expires: remember ? addDays(new Date(), 7) : addDays(new Date(), 1),
    httpOnly: true,
    sameSite: "strict",
  });

  return response;
}
