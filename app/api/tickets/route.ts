import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import dbConnect from "@/utils/db";
import Ticket from "@/models/ticket";
import { inngest } from "@/inngest/client";

export const dynamic = "force-dynamic"; // avoid caching for dashboard lists

/** ---- Types describing the *lean* shapes we read/return ---- */
type TicketStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
type TicketPriority = "low" | "medium" | "high";

type DbUserRefObj = { _id: unknown; name?: string; email?: string };
type DbRef = string | DbUserRefObj;

type ModeratorReplyLean = {
  code?: string;
  explanation?: string;
  repliedAt?: string | Date;
};

type DbTicketLean = {
  _id: unknown;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority?: "low" | "medium" | "high";
  createdBy?: DbRef;
  assignedTo?: DbRef | null;
  relatedSkills?: string[];
  skills?: string[];
  createdAt?: string | Date;
  deadline?: string | Date | null;
  helpfulNotes?: string;
  replyFromModerator?: ModeratorReplyLean | null;
};

type DbTicketCreated = {
  _id: unknown;
  title: string;
  description: string;
  status: TicketStatus;
  priority?: TicketPriority;
  createdBy?: DbRef;
  assignedTo?: DbRef | null;
  relatedSkills?: string[];
  skills?: string[]; // legacy field, normalized below
  createdAt?: string | Date;
  deadline: string | Date;
  helpfulNotes?: string;
};

function toIso(d: string | Date): string; // when required → always string
function toIso(d: string | Date | null | undefined): string | undefined;
function toIso(d: string | Date | null | undefined) {
  if (!d) return undefined;
  return new Date(d).toISOString();
}

/** ---- Small helpers to keep the response shape stable & typed ---- */
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isPopulatedUser = (u: unknown): u is DbUserRefObj =>
  isObj(u) && "_id" in u && ("name" in u || "email" in u);

/**
 * normalizeRef:
 * - if populated → return {_id, name, email?}
 * - if not populated → return string id
 * - preserve null/undefined for optional fields
 */
function normalizeRef(
  u: DbRef | null | undefined
): string | { _id: string; name: string; email?: string } | null | undefined {
  if (u == null) return u;
  if (isPopulatedUser(u)) {
    return {
      _id: String(u._id),
      name: typeof u.name === "string" ? u.name : "",
      email: typeof u.email === "string" ? u.email : undefined,
    };
  }
  return String(u);
}

/** ******************************************************************
 * GET /api/tickets
 * - Populates createdBy/assignedTo with name+email when available
 * - Normalizes references so UI can safely render them
 ******************************************************************* */
export async function GET() {
  await dbConnect();

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // --- Branch by role ---
    let docs: DbTicketLean[] = [];

    // a) Admin/Moderator → all tickets, populate both people refs, newest first
    if (user.role !== "user") {
      docs = await Ticket.find()
        .populate("assignedTo", ["name", "email", "_id"])
        .populate("createdBy", ["name", "email", "_id"])
        .sort({ createdAt: -1 })
        .lean<DbTicketLean[]>()
        .exec();
    }

    // b) Regular user → only their tickets, populate assignee, newest first
    if (user.role === "user") {
      docs = await Ticket.find({ createdBy: user._id.toString() })
        .populate("assignedTo", ["name", "email"])
        .populate("createdBy", ["name", "email"])
        .sort({ createdAt: -1 })
        .lean<DbTicketLean[]>()
        .exec();
    }

    // --- Map docs to normalized tickets (incl. replyFromModerator) ---
    const tickets = docs.map((t) => ({
      _id: String(t._id),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority ?? undefined,
      helpfulNotes: t.helpfulNotes ?? undefined,
      createdBy: normalizeRef(t.createdBy),
      assignedTo: normalizeRef(t.assignedTo),
      relatedSkills: t.relatedSkills ?? t.skills ?? [],
      createdAt: toIso(t.createdAt),
      deadline: toIso(t.deadline),
      replyFromModerator: t.replyFromModerator
        ? {
            code: t.replyFromModerator.code ?? undefined,
            explanation: t.replyFromModerator.explanation ?? "",
            repliedAt: toIso(t.replyFromModerator.repliedAt),
          }
        : undefined,
    }));

    return NextResponse.json({ tickets }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}

/** ******************************************************************
 * POST /api/tickets
 * - Creates a new ticket
 * - Schedules AI processing via Inngest
 * - Returns a normalized ticket payload
 ******************************************************************* */
type PostBody = {
  title: string;
  description: string;
  deadline?: string;
  priority?: TicketPriority;
  assignedTo?: string | null;
  relatedSkills?: string[];
};

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { title, description, deadline, priority, assignedTo, relatedSkills } =
    (await req.json()) as {
      title: string;
      description: string;
      deadline?: string;
      priority?: "low" | "medium" | "high";
      assignedTo?: string | null;
      relatedSkills?: string[];
    };

  const effectiveDeadline =
    deadline != null
      ? new Date(deadline)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const created = await Ticket.create({
    title,
    description,
    status: "TODO",
    priority: priority ?? "medium",
    createdBy: user._id,
    assignedTo: assignedTo ?? null,
    relatedSkills: relatedSkills ?? [],
    deadline: effectiveDeadline,
  });

  // Kick background AI
  await inngest.send({
    name: "ticket/create",
    data: { ticketId: created._id.toString() },
  });

  // 🔽 Re-read with populate so the dashboard gets names immediately
  const t = await Ticket.findById(created._id)
    .populate("createdBy", "name email _id")
    .populate("assignedTo", "name email _id")
    .lean<DbTicketCreated>()
    .exec();

  if (!t) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const ticket = {
    _id: String(t._id),
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority ?? "medium",
    createdBy: normalizeRef(t.createdBy), // <-- now {_id,name,email?} or string id
    assignedTo: normalizeRef(t.assignedTo), // <-- idem (often null right after create)
    relatedSkills: t.relatedSkills ?? t.skills ?? [],
    createdAt: toIso(t.createdAt),
    deadline: toIso(t.deadline),
    helpfulNotes: t.helpfulNotes ?? undefined,
  };

  return NextResponse.json({ ticket }, { status: 201 });
}
