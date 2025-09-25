import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import User from "@/models/user";
import { sendEmail } from "@/utils/mailer";

type SignupEvent = {
  name: "user/signup";
  data: {
    email: string;
  };
};

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },
  async ({ event, step }) => {
    const { email } = (event as SignupEvent).data;

    // 1) Load user by email (non-retriable if missing, matches legacy behavior)
    const user = await step.run("get-user-email", async () => {
      const doc = await User.findOne({ email }).lean<{
        name: string;
        email: string;
      } | null>();
      if (!doc) {
        throw new NonRetriableError(`User with email ${email} not found.`);
      }
      return doc;
    });

    // 2) Send welcome email
    await step.run("send-welcome-email", async () => {
      const subject = "Welcome to the App!";
      const text = `Hello ${user.name},

Welcome to our application! We are excited to have you on board.`;

      await sendEmail({ to: user.email, subject, text });
      if (process.env.NODE_ENV !== "production") {
        console.log(`Welcome email sent to ${user.email}`);
      }
    });

    return { success: true as const };
  }
);
