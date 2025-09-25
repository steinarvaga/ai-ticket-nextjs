import { z } from "zod";
import bcrypt from "bcrypt";
import User from "@/models/user";
import dbConnect from "@/utils/db";
import { inngest } from "@/inngest/client";

const schema = z.object({
  email: z.string(),
  password: z.string().min(3),
  name: z.string(),
  role: z.enum(["user", "moderator", "admin"]),
  skills: z.array(z.string()),
});

export async function POST(request: Request) {
  await dbConnect(); // ensure DB is connected

  const formData = await request.formData();

  // The "skills" field is submitted as a single comma-separated string; split it into an array of skills
  const skillsValue = formData.get("skills");
  const skillsList =
    typeof skillsValue === "string"
      ? skillsValue
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill)
      : [];

  // Default the role to "user" on the server side since the form does not send this field
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: "user",
    skills: skillsList,
  });
  if (!parsed.success) {
    // If validation fails, return detailed error messages from Zod
    return Response.json({ success: false, errors: parsed.error.issues });
  }

  const { email, password, name, role, skills } = parsed.data;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return Response.json({ success: false, error: "User already exists." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    // Create the new user using validated data (including name, role, skills). Password is hashed above.
    await User.create({ email, name, password: hashedPassword, role, skills });

    // Fire the async welcome flow
    await inngest.send({
      name: "user/signup",
      data: { email },
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Registration error:", err);
    return Response.json({ success: false, error: "Registration failed." });
  }
}
