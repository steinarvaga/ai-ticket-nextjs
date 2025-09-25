"use client";

import React from "react";
import Card from "@/components/common/Card";
import Badge from "@/components/common/Badge";
import { formatDate, formatDateTime } from "@/utils/date";
import type { Ticket, TicketPriority, TicketStatus } from "@/lib/types";

function toneForPriority(p?: TicketPriority) {
  return p === "high" ? "red" : p === "medium" ? "yellow" : "green";
}
function toneForStatus(s?: TicketStatus) {
  return s === "completed" ? "green" : s === "in_progress" ? "blue" : "gray";
}

export default function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: Ticket;
  onOpen: (id: string) => void;
}) {
  const {
    _id,
    title,
    description,
    priority,
    status,
    creator,
    assignee,
    createdAt,
    deadline,
    skills = [],
  } = ticket;

  return (
    <Card className="p-4" onClick={() => onOpen(_id)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-gray-900">{title}</h4>
        <div className="flex items-center gap-2">
          <Badge tone={toneForPriority(priority)}>{priority}</Badge>
          <Badge tone={toneForStatus(status)}>{status}</Badge>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{description}</p>

      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
        <div>
          <span className="font-medium text-gray-700">Creator:</span>{" "}
          {creator?.name?.trim() || "—"}
        </div>
        <div>
          <span className="font-medium text-gray-700">Assignee:</span>{" "}
          {assignee?.name?.trim() || "—"}
        </div>
        <div>
          <span className="font-medium text-gray-700">Created:</span>{" "}
          {formatDate(createdAt)}
        </div>
        <div>
          <span className="font-medium text-gray-700">Deadline:</span>{" "}
          {formatDateTime(deadline)}
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <Badge key={s} tone="purple">
              {s}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
