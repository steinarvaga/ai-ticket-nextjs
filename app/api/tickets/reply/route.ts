import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth";
import dbConnect from "@/utils/db";
import Ticket from "@/models/ticket";
import { sendEmail } from "@/utils/mailer";

export const dynamic = "force-dynamic";

// Minimal lean doc shape (mirror what you used in the other routes)
type DbRef = string | { _id: unknown; name?: string };

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
  replyFromModerator?: ModeratorReplyLean | null;
};

export async function POST(req: NextRequest) {
  await dbConnect();
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { ticketId, code, explanation } = await req.json();
  if (!ticketId) {
    return NextResponse.json({ message: "ticketId required" }, { status: 400 });
  }

  const t = await Ticket.findByIdAndUpdate(
    ticketId,
    {
      $set: {
        replyFromModerator: {
          code: code ?? "",
          explanation: explanation ?? "",
          repliedAt: new Date(),
        },
      },
    },
    { new: true }
  )
    .lean<DbTicketLean>() // 👈 make the result an explicitly-typed single lean doc
    .exec();

  if (!t) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

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
    deadline: t.deadline ? new Date(t.deadline).toISOString() : null,
    replyFromModerator: t.replyFromModerator
      ? {
          code: t.replyFromModerator.code ?? undefined,
          explanation: t.replyFromModerator.explanation ?? "",
          repliedAt: t.replyFromModerator.repliedAt,
        }
      : undefined,
  };

  // Narrow "user" safely without using "any"
  const getDisplayName = (u: unknown): string => {
    if (typeof u === "object" && u !== null && "name" in u) {
      const name = (u as Record<string, unknown>).name;
      if (typeof name === "string" && name.trim()) return name;
    }
    return "a user";
  };

  // ✅ Added from the snippet: send an email using utils/mailer
  // Note: We cannot re-read req.json() here without changing existing code,
  // so this uses an env-configured recipient. Set TICKET_REPLY_NOTIFY_TO if you want this to fire.
  try {
    const notifyTo = process.env.TICKET_REPLY_NOTIFY_TO;
    if (notifyTo) {
      const subject = `New reply on ticket: ${ticket.title}`;
      const html = `
      <p>A new reply was added by ${getDisplayName(user)}.</p>
      <p><strong>Ticket ID:</strong> ${ticket._id}</p>
      <p><strong>Title:</strong> ${ticket.title}</p>
      ${code ? `<p><strong>Code:</strong></p><pre>${String(code)}</pre>` : ""}
      ${
        explanation
          ? `<p><strong>Explanation:</strong></p><p>${String(explanation)}</p>`
          : ""
      }
    `;
      await sendEmail({ to: notifyTo, subject, html });
    }
  } catch (err: unknown) {
    if (process.env.NODE_ENV !== "production") {
      console.error("sendEmail failed in /api/tickets/reply:", err);
    }
    // Intentionally do not fail the API if email sending fails.
  }

  return NextResponse.json({ ticket });
}
