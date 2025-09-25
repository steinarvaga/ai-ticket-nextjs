"use client";
import React, { useMemo, useState } from "react";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import EmptyState from "@/components/common/EmptyState";
import ErrorAlert from "@/components/common/ErrorAlert";
import TicketForm from "./TicketForm";
import TicketList from "./TicketList";
import type { Ticket } from "@/lib/types";

export default function TicketsSection({
  role,
  tickets,
  loading,
  error,
  onDismissError,
  onCreateTicket,
  onOpenTicket,
}: {
  role?: "user" | "admin" | "moderator";
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  onDismissError: () => void;
  onCreateTicket: (payload: {
    title: string;
    description: string;
    deadline?: string | null;
  }) => Promise<void>;
  onOpenTicket: (id: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const title = useMemo(
    () => (role === "user" ? "My Tickets" : "All Tickets"),
    [role]
  );

  return (
    <section>
      <Card className="mb-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <Button variant="ghost" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ New Ticket"}
          </Button>
        </div>
      </Card>

      {showForm && (
        <TicketForm
          submitting={loading}
          onCreate={async (payload, reset) => {
            await onCreateTicket(payload);
            reset();
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ErrorAlert message={error} onDismiss={onDismissError} />

      {loading ? (
        <Loader label="Loading tickets…" />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon="🎫"
          title="No tickets yet"
          subtitle="Create your first ticket to get started."
        />
      ) : (
        <TicketList tickets={tickets} onOpen={onOpenTicket} />
      )}
    </section>
  );
}
