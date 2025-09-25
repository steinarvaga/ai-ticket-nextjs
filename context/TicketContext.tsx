"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

/** ----------------------------------------------------------------
 * Types aligned to your Mongoose schema
 * ---------------------------------------------------------------- */
export type TicketStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
export type TicketPriority = "low" | "medium" | "high" | (string & {});

// Narrow priority keys used for UI stats/counts
export const PRIORITY_KEYS = ["low", "medium", "high"] as const;
export type PriorityKey = (typeof PRIORITY_KEYS)[number];

export const isPriorityKey = (p: unknown): p is PriorityKey =>
  PRIORITY_KEYS.includes(p as PriorityKey);

export interface UserRef {
  _id: string;
  email?: string;
  name?: string;
}

export interface ModeratorReply {
  code?: string;
  explanation?: string;
  repliedAt?: Date; // coerced to Date for components
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: TicketStatus;
  createdBy?: UserRef | string;
  assignedTo?: UserRef | string | null;
  priority?: TicketPriority;
  deadline?: Date; // coerced to Date for components
  helpfulNotes?: string;
  relatedSkills?: string[];
  replyFromModerator?: ModeratorReply | null;
  createdAt?: Date; // coerced to Date for components
  [key: string]: unknown;
}

/** ----------------------------------------------------------------
 * Small runtime helpers
 * ---------------------------------------------------------------- */
const isUserRef = (u: unknown): u is UserRef =>
  typeof u === "object" &&
  u !== null &&
  "_id" in (u as Record<string, unknown>);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Convert unknown string/Date/undefined to Date | undefined (safe for UI)
const toDate = (v: unknown): Date | undefined => {
  if (v == null) return undefined;
  if (v instanceof Date) return v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? undefined : d;
};

// For requests: accept string | Date | undefined and return ISO | undefined
const toIso = (v: unknown): string | undefined => {
  const d = toDate(v);
  return d ? d.toISOString() : undefined;
};

/** ----------------------------------------------------------------
 * Zod schemas: server response parsing (coerce dates to Date)
 * ---------------------------------------------------------------- */

const TicketStatusEnum = z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]);
const UserRefSchema = z.union([
  z.string(),
  z.object({
    _id: z.string(),
    email: z.string().email().optional(),
    name: z.string().optional(),
  }),
]);

const ModeratorReplySchema = z
  .object({
    code: z.string().optional(),
    explanation: z.string().optional(),
    repliedAt: z.union([z.string(), z.date()]).optional(),
  })
  .transform((x) => ({
    ...x,
    repliedAt: toDate(x.repliedAt),
  }));

const TicketSchema = z
  .object({
    _id: z.string(),
    title: z.string(),
    description: z.string(),
    status: TicketStatusEnum,
    createdBy: UserRefSchema.optional(),
    assignedTo: UserRefSchema.nullable().optional(),
    priority: z.string().optional(), // keep open; UI uses low/medium/high
    deadline: z.union([z.string(), z.date()]).optional(),
    helpfulNotes: z.string().optional(),
    relatedSkills: z.array(z.string()).optional(),
    replyFromModerator: ModeratorReplySchema.nullable().optional(),
    createdAt: z.union([z.string(), z.date()]).optional(),
  })
  .transform((t) => ({
    ...t,
    // Coerce dates for components
    deadline: toDate(t.deadline),
    createdAt: toDate(t.createdAt),
  })) satisfies z.ZodType<Ticket>;

const ApiSingleResponseSchema = z.object({ ticket: TicketSchema });
const ApiListResponseSchema = z.object({ tickets: z.array(TicketSchema) });

/** ----------------------------------------------------------------
 * Zod schemas: request payloads (validate + serialize deadlines)
 * ---------------------------------------------------------------- */

const CreateTicketPayloadSchema = z
  .object({
    title: z.string().min(1, "title is required"),
    description: z.string().min(1, "description is required"),
    deadline: z.union([z.string(), z.date()]).optional(),
    priority: z.string().optional(),
    assignedTo: z.union([z.string(), z.null()]).optional(),
    relatedSkills: z.array(z.string()).optional(),
  })
  .transform((p) => ({
    ...p,
    deadline: toIso(p.deadline),
  }));

const UpdateTicketPayloadSchema = z
  .object({
    ticketId: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    status: TicketStatusEnum.optional(),
    helpfulNotes: z.string().optional(),
    deadline: z.union([z.string(), z.date()]).optional(),
    priority: z.string().optional(),
    assignedTo: z.union([z.string(), z.null()]).optional(),
    relatedSkills: z.array(z.string()).optional(),
  })
  .transform((p) => ({
    ...p,
    deadline: toIso(p.deadline),
  }));

const ReplyTicketPayloadSchema = z.object({
  ticketId: z.string().min(1),
  code: z.string().optional(),
  explanation: z.string().min(1),
});

/** ----------------------------------------------------------------
 * Context contract
 * ---------------------------------------------------------------- */

interface TicketStats {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  high: number;
  medium: number;
  low: number;
}

interface TicketContextType {
  // State
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  selectedTicket: Ticket | null;

  // Actions
  fetchTickets: () => Promise<void>;
  fetchTicketById: (ticketId: string) => Promise<Ticket | null>;

  createTicket: (
    args: z.input<typeof CreateTicketPayloadSchema>
  ) => Promise<Ticket | null>;
  updateTicket: (
    args: z.input<typeof UpdateTicketPayloadSchema>
  ) => Promise<Ticket | null>;
  replyToTicket: (
    args: z.input<typeof ReplyTicketPayloadSchema>
  ) => Promise<Ticket | null>;

  // Helpers
  getTicketsByStatus: (status: TicketStatus) => Ticket[];
  getTicketsByPriority: (priority: TicketPriority) => Ticket[];
  getAssignedTickets: (userId: string) => Ticket[];
  getMyTickets: (userId: string) => Ticket[];
  getTicketStats: () => TicketStats;
  clearError: () => void;
  clearSelectedTicket: () => void;

  // Setters
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setSelectedTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
}

/** ----------------------------------------------------------------
 * Context + Provider
 * ---------------------------------------------------------------- */

// ---- poller: refetch this ticket until AI assigns it ----
async function pollUntilAssigned(
  id: string,
  onUpdate: (t: Ticket) => void,
  {
    tries = 12,
    intervalMs = 1500,
    base = "/api/tickets",
  }: { tries?: number; intervalMs?: number; base?: string } = {}
): Promise<void> {
  for (let i = 0; i < tries; i++) {
    await sleep(intervalMs);

    const res = await fetch(`${base}/${id}`, { cache: "no-store" });
    if (!res.ok) break;

    // 👇 Use the schema you already defined in this file
    const json = await res.json();
    const parsed = ApiSingleResponseSchema.parse(json);
    const t = parsed.ticket;

    if (isUserRef(t.assignedTo)) {
      onUpdate(t);
      break;
    }
  }
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function useTickets() {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error("useTickets must be used within a TicketProvider");
  return ctx;
}

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = "/api/tickets";

  const handleApiError = useCallback(
    async (res: Response): Promise<null> => {
      let msg = `HTTP ${res.status}`;
      try {
        const body = (await res.json()) as { message?: string; error?: string };
        if (body?.message) msg = body.message;
        else if (body?.error) msg = body.error;
      } catch {
        if (res.statusText) msg = `${msg}: ${res.statusText}`;
      }

      if (res.status === 401) {
        router.push("/login");
      }

      setError(msg);
      return null;
    },
    [router]
  );

  const fetchTickets = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(base, { method: "GET", cache: "no-store" });

      // If the response is not OK, let the centralized handler set UI state and possibly redirect.
      if (!res.ok) {
        await handleApiError(res); // returns null, does NOT throw
        return; // important: stop here
      }

      // OK -> decode + validate -> commit to state
      const json = await res.json();
      const parsed = ApiListResponseSchema.parse(json);
      setTickets(parsed.tickets);
    } catch (err) {
      // Network/parse failures that don't produce an HTTP response
      const msg =
        err instanceof Error
          ? err.message
          : "Network error while fetching tickets.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const fetchTicketById = useCallback(
    async (ticketId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${base}/${ticketId}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          await handleApiError(res);
          return null;
        }
        const json = await res.json();
        const parsed = ApiSingleResponseSchema.parse(json);
        setSelectedTicket(parsed.ticket);
        return parsed.ticket;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError]
  );

  const createTicket = useCallback(
    async (
      args: z.input<typeof CreateTicketPayloadSchema>
    ): Promise<Ticket | null> => {
      const payload = CreateTicketPayloadSchema.parse(args); // validate + ISO-ize deadline
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(base, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          await handleApiError(res); // sets error, may redirect
          return null;
        }

        const json = await res.json();
        const parsed = ApiSingleResponseSchema.parse(json);
        const created = parsed.ticket;

        // Optimistically prepend
        setTickets((prev) => [created, ...prev]);

        // If AI hasn't assigned yet, poll and merge when ready
        if (!isUserRef(created.assignedTo)) {
          void pollUntilAssigned(
            created._id,
            (updated) => {
              setTickets((prev) =>
                prev.map((t) => (t._id === updated._id ? updated : t))
              );
            },
            { base } // reuse your existing API base (e.g., "/api/tickets")
          );
        }

        return created;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Network error while creating ticket."
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [base, handleApiError]
  );

  const updateTicket = useCallback(
    async (
      args: z.input<typeof UpdateTicketPayloadSchema>
    ): Promise<Ticket | null> => {
      const payload = UpdateTicketPayloadSchema.parse(args);
      const { ticketId } = payload;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${base}/${ticketId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          await handleApiError(res);
          return null;
        }

        const json = await res.json();
        const parsed = ApiSingleResponseSchema.parse(json);

        setTickets((prev) =>
          prev.map((t) => (t._id === ticketId ? parsed.ticket : t))
        );
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(parsed.ticket);
        }
        return parsed.ticket;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Network error while updating ticket."
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, selectedTicket]
  );

  const replyToTicket = useCallback(
    async (
      args: z.input<typeof ReplyTicketPayloadSchema>
    ): Promise<Ticket | null> => {
      const payload = ReplyTicketPayloadSchema.parse(args);
      const { ticketId } = payload;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${base}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          await handleApiError(res);
          return null;
        }

        const json = await res.json();
        const parsed = ApiSingleResponseSchema.parse(json);

        setTickets((prev) =>
          prev.map((t) => (t._id === ticketId ? parsed.ticket : t))
        );
        if (selectedTicket?._id === ticketId) {
          setSelectedTicket(parsed.ticket);
        }
        return parsed.ticket;
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Network error while replying to ticket."
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [handleApiError, selectedTicket]
  );

  /** ------------------------------------------
   * Selectors & stats (unchanged, now benefit from real Date objects)
   * ------------------------------------------ */
  const getTicketsByStatus = useCallback(
    (status: TicketStatus) => tickets.filter((t) => t.status === status),
    [tickets]
  );

  const getTicketsByPriority = useCallback(
    (priority: TicketPriority) =>
      tickets.filter((t) => t.priority === priority),
    [tickets]
  );

  const getAssignedTickets = useCallback(
    (userId: string) =>
      tickets.filter((t) => {
        const a = t.assignedTo;
        if (!a) return false;
        return typeof a === "string" ? a === userId : a._id === userId;
      }),
    [tickets]
  );

  const getMyTickets = useCallback(
    (userId: string) =>
      tickets.filter((t) => {
        const c = t.createdBy;
        if (!c) return false;
        return typeof c === "string" ? c === userId : c._id === userId;
      }),
    [tickets]
  );

  const getTicketStats = useCallback((): TicketStats => {
    const byStatus: Record<TicketStatus, number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
    };

    // Strictly typed, no 'any'
    const byPriority: Record<PriorityKey, number> = {
      low: 0,
      medium: 0,
      high: 0,
    };

    for (const t of tickets) {
      if (t.status && byStatus[t.status] !== undefined) {
        byStatus[t.status]++;
      }
      if (t.priority && isPriorityKey(t.priority)) {
        byPriority[t.priority]++;
      }
    }

    return {
      total: tickets.length,
      todo: byStatus.TODO,
      inProgress: byStatus.IN_PROGRESS,
      completed: byStatus.COMPLETED,
      high: byPriority.high,
      medium: byPriority.medium,
      low: byPriority.low,
    };
  }, [tickets]);

  const clearError = useCallback(() => setError(null), []);
  const clearSelectedTicket = useCallback(() => setSelectedTicket(null), []);

  const value = useMemo<TicketContextType>(
    () => ({
      tickets,
      loading,
      error,
      selectedTicket,

      fetchTickets,
      fetchTicketById,
      createTicket,
      updateTicket,
      replyToTicket,

      getTicketsByStatus,
      getTicketsByPriority,
      getAssignedTickets,
      getMyTickets,
      getTicketStats,
      clearError,
      clearSelectedTicket,

      setTickets,
      setSelectedTicket,
    }),
    [
      tickets,
      loading,
      error,
      selectedTicket,
      fetchTickets,
      fetchTicketById,
      createTicket,
      updateTicket,
      replyToTicket,
      getTicketsByStatus,
      getTicketsByPriority,
      getAssignedTickets,
      getMyTickets,
      getTicketStats,
      clearError,
      clearSelectedTicket,
    ]
  );

  return (
    <TicketContext.Provider value={value}>{children}</TicketContext.Provider>
  );
}
