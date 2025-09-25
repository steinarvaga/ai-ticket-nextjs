import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { onUserSignup } from "@/inngest/functions/on-signup";
import { onTicketCreated } from "@/inngest/functions/on-ticket-create";

/**
 * Next.js route handler used by the Inngest runtime to:
 * - discover (register) all exported functions
 * - deliver events & trigger function executions
 * - run local dev via `inngest dev`
 * - perform health checks
 *
 * IMPORTANT: Our functions use DB + Node-only libs, so we force the Node.js
 * runtime (not Edge).
 */
export const runtime = "nodejs";

// Optional: increase max duration for long-running steps (seconds)
export const maxDuration = 300;

// Optional: avoid caching this route
export const dynamic = "force-dynamic";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [onUserSignup, onTicketCreated],
});
