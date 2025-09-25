import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import dbConnect from "@/utils/db";
import Ticket from "@/models/ticket";

export const dynamic = "force-dynamic";

// Minimal shape of the *lean* ticket doc (mirror the one used in /api/tickets)
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

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isPopulatedUser = (u: unknown): u is DbUserRefObj =>
  isObj(u) && "_id" in u && ("name" in u || "email" in u);

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

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await dbConnect();
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  //Explicit lean type; avoids union with array/single
  const t = await Ticket.findById(id)
    .populate("createdBy", "name email _id")
    .populate("assignedTo", "name email _id")
    .lean<DbTicketLean>()
    .exec();

  if (!t) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const ticket = {
    _id: String(t._id),
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority ?? undefined,
    helpfulNotes: t.helpfulNotes ?? undefined,
    createdBy: normalizeRef(t.createdBy),
    assignedTo: normalizeRef(t.assignedTo),
    relatedSkills: t.relatedSkills ?? t.skills ?? [],
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
    deadline: t.deadline ? new Date(t.deadline).toISOString() : undefined,
    replyFromModerator: t.replyFromModerator
      ? {
          code: t.replyFromModerator.code ?? undefined,
          explanation: t.replyFromModerator.explanation ?? "",
          repliedAt: t.replyFromModerator.repliedAt
            ? new Date(t.replyFromModerator.repliedAt).toISOString()
            : undefined,
        }
      : undefined,
  };
  return NextResponse.json({ ticket });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await dbConnect();
  const user = await getAuthenticatedUser();
  if (!user)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const payload = await req.json();
  const {
    title,
    description,
    status,
    helpfulNotes,
    deadline,
    priority,
    assignedTo,
    relatedSkills,
  } = payload;

  const update: Record<string, unknown> = {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(status !== undefined && { status }),
    ...(helpfulNotes !== undefined && { helpfulNotes }),
    ...(priority !== undefined && { priority }),
    ...(assignedTo !== undefined && { assignedTo }),
    ...(relatedSkills !== undefined && { relatedSkills }),
    ...(deadline === null
      ? { deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      : deadline !== undefined
      ? { deadline: new Date(deadline) }
      : {}),
  };

  // 👇 Explicit lean type; includes null check
  const t = await Ticket.findByIdAndUpdate(id, update, { new: true })
    .lean<DbTicketLean>()
    .exec();
  if (!t) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const ticket = {
    _id: String(t._id),
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority ?? undefined,
    createdBy: t.createdBy
      ? typeof t.createdBy === "object"
        ? { _id: String(t.createdBy._id), name: t.createdBy.name ?? "" }
        : String(t.createdBy)
      : undefined,
    assignedTo: t.assignedTo
      ? typeof t.assignedTo === "object"
        ? { _id: String(t.assignedTo._id), name: t.assignedTo.name ?? "" }
        : String(t.assignedTo)
      : null,
    relatedSkills: t.relatedSkills ?? t.skills ?? [],
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
    deadline: t.deadline ? new Date(t.deadline).toISOString() : undefined,
  };

  return NextResponse.json({ ticket });
}
