import { Inngest } from "inngest";

/**
 * Global Inngest client for this app.
 * Keep the same app id as legacy to preserve event namespaces & observability.
 */
export const inngest = new Inngest({
  id: "ai-ticket", // legacy id preserved
});
