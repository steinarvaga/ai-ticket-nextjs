import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import Ticket from "@/models/ticket";
import User from "@/models/user";
import { analyzeTicket } from "@/utils/ai";
import {
  rulePriority,
  pickHigher,
  type Priority,
} from "@/utils/priority-rules";
import { sendEmail } from "@/utils/mailer";

type TicketCreateEvent = {
  name: "ticket/create";
  data: {
    ticketId: string;
  };
};

// Minimal lean shape used locally to avoid coupling to Mongoose types
type TicketLean = {
  _id: unknown;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "COMPLETED";
  priority?: "low" | "medium" | "high";
  createdBy?: string | { _id: unknown; name?: string; email?: string };
  assignedTo?: string | { _id: unknown } | null;
  relatedSkills?: string[];
  deadline?: Date | string | null;
};

type ModeratorLean = {
  _id: unknown;
  name: string;
  email: string;
  role: "user" | "moderator" | "admin";
  skills?: string[];
};

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-create", retries: 2 },
  { event: "ticket/create" },
  async ({ event, step }) => {
    const { ticketId } = (event as TicketCreateEvent).data;

    // 1) Fetch ticket
    const ticket = await step.run("get-ticket-details", async () => {
      const doc = await Ticket.findById(ticketId)
        .populate("createdBy", "name email _id")
        .lean<TicketLean | null>();

      console.log("1) INNGEST-ON-TICKET-CREATE-DOC", doc);

      if (!doc) {
        throw new NonRetriableError(`Ticket with ID ${ticketId} not found.`);
      }
      return doc;
    });

    // 2) Set initial status to TODO (same as legacy)
    await step.run("update-ticket-status", async () => {
      await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
    });

    // 3) AI analysis (Gemini via utils/ai.ts)
    const ai = await analyzeTicket({
      title: ticket.title,
      description: ticket.description,
    });

    // Now wrap only the DB update in a step
    await step.run("persist-ai-results", async () => {
      // Deterministic rule overlay based on title/description/deadline
      const ruleBased = rulePriority({
        title: ticket.title,
        description: ticket.description,
        deadline: ticket.deadline ?? null,
      });

      // Guard AI priority to enum (also enforced by Zod in analyzeTicket)
      const aiPriority: Priority =
        ai.priority === "low" ||
        ai.priority === "medium" ||
        ai.priority === "high"
          ? ai.priority
          : "medium";

      // Blend: take the higher priority between AI and rules
      const finalPriority = pickHigher(aiPriority, ruleBased);

      await Ticket.findByIdAndUpdate(ticket._id, {
        priority: finalPriority,
        helpfulNotes: ai.helpfulNotes,
        status: "IN_PROGRESS",
        relatedSkills: Array.isArray(ai.relatedSkills) ? ai.relatedSkills : [],
      });
    });

    // 4) Choose assignee (moderator by skills; fallback admin)
    const moderator = await step.run("assign-moderator", async () => {
      const skillsRegex =
        ai && ai.relatedSkills.length > 0 ? ai.relatedSkills.join("|") : "";

      let mod = await User.findOne({
        role: "moderator",
        ...(skillsRegex
          ? {
              skills: {
                $elemMatch: {
                  $regex: skillsRegex,
                  $options: "i",
                },
              },
            }
          : {}),
      })
        .select("name email role skills")
        .lean<ModeratorLean | null>();

      if (!mod) {
        mod = await User.findOne({ role: "admin" })
          .select("name email role skills")
          .lean<ModeratorLean | null>();
      }

      await Ticket.findByIdAndUpdate(ticket._id, {
        assignedTo: mod?._id ?? null,
      });

      return mod;
    });

    // 5) Notify assignee
    await step.run("send-email-notification", async () => {
      if (!moderator) return;

      // Re-fetch for a fresh snapshot with creator populated (mirrors legacy)
      const finalTicket = await Ticket.findById(ticket._id)
        .populate("createdBy", "name email")
        .lean<TicketLean | null>();

      if (finalTicket) {
        console.log(
          "INNGEST-ON-TICKET-CREATE-CREATED-BY",
          finalTicket.createdBy
        );
      }

      if (!finalTicket) return;

      const creator =
        typeof finalTicket.createdBy === "object" && finalTicket.createdBy
          ? `${finalTicket.createdBy.name ?? ""} (${
              finalTicket.createdBy.email ?? ""
            })`
          : "Unknown";

      await sendEmail({
        to: moderator.email,
        subject: "New Ticket Assigned",
        text: `Hello ${moderator.name},

A new ticket has been assigned to you:

Title: ${finalTicket.title}
Description: ${finalTicket.description}
Created By: ${creator}
`,
      });
    });

    return { success: true as const };
  }
);
