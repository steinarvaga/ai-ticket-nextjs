import { Schema, models, model } from "mongoose";

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "user", enum: ["user", "moderator", "admin"] },
  skills: [String],
  createdAt: { type: Date, default: Date.now },
});

// Reuse if already compiled (avoids OverwriteModelError in dev/serverless)
const User = models.User || model("User", userSchema);

export default User;
