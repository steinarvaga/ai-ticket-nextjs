"use client";
import React from "react";
import TicketCard from "./TicketCard";
import type { Ticket } from "@/lib/types";

export default function TicketList({
  tickets,
  onOpen,
}: {
  tickets: Ticket[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <TicketCard key={t._id} ticket={t} onOpen={onOpen} />
      ))}
    </div>
  );
}
