"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import HeaderBar from "@/components/dashboard/HeaderBar";
import StatsBar, { type Stats } from "@/components/dashboard/StatsBar";
import TicketsSection from "@/components/dashboard/TicketsSection";
import UserInfoCard from "@/components/dashboard/UserInfoCard";

import { useAuth } from "@/context/AuthContext";
import { useTickets } from "@/context/TicketContext";

import type {
  Ticket as CtxTicket,
  TicketStatus as CtxStatus,
} from "@/context/TicketContext";

import type {
  Ticket as UiTicket,
  TicketStatus as UiStatus,
  TicketPriority as UiPriority,
} from "@/lib/types";

function mapStatus(s: CtxStatus): UiStatus {
  switch (s) {
    case "TODO":
      return "todo";
    case "IN_PROGRESS":
      return "in_progress";
    case "COMPLETED":
      return "completed";
    default:
      return "todo";
  }
}

function normalizePriority(p: unknown): UiPriority {
  return p === "low" || p === "medium" || p === "high" ? p : "medium";
}

function toIso(d?: Date | null): string | null | undefined {
  if (d == null) return d as null | undefined;
  return d.toISOString();
}

function adaptTicket(t: CtxTicket): UiTicket {
  // creator
  const creator =
    t.createdBy == null
      ? undefined
      : typeof t.createdBy === "string"
      ? { _id: t.createdBy, name: "" }
      : { _id: t.createdBy._id, name: t.createdBy.name ?? "" };

  // assignee
  const assignee =
    t.assignedTo == null
      ? null
      : typeof t.assignedTo === "string"
      ? { _id: t.assignedTo, name: "" }
      : { _id: t.assignedTo._id, name: t.assignedTo.name ?? "" };

  return {
    _id: t._id,
    title: t.title,
    description: t.description,
    status: mapStatus(t.status), // UPPER → lower
    priority: normalizePriority(t.priority), // make required
    creator,
    assignee,
    skills: t.relatedSkills, // pass through if present
    createdAt: toIso(t.createdAt) ?? undefined, // Date → ISO (optional)
    deadline: (toIso(t.deadline) ?? undefined) as UiTicket["deadline"],
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    fetchTickets,
    createTicket,
    clearError,
  } = useTickets();

  const handleCreateTicket = async (payload: {
    title: string;
    description: string;
    deadline?: string | null;
  }): Promise<void> => {
    const { title, description, deadline } = payload;
    // Map null → undefined to satisfy TicketContext’s type
    await createTicket({ title, description, deadline: deadline ?? undefined });
  };

  const [loggingOut, setLoggingOut] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setRedirecting(true);
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  const uiTickets = useMemo<UiTicket[]>(
    () => tickets.map(adaptTicket),
    [tickets]
  );

  const stats: Stats = useMemo(() => {
    const count = (s: UiStatus) =>
      uiTickets.filter((t) => t.status === s).length;
    return {
      total: uiTickets.length,
      todo: count("todo"),
      inProgress: count("in_progress"),
      completed: count("completed"),
    };
  }, [uiTickets]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  if (authLoading || redirecting) {
    return <div className="p-8 text-gray-600">Checking authentication…</div>;
  }
  if (!user) return null;

  return (
    <main className="mx-auto max-w-6xl p-4">
      <HeaderBar
        appTitle="Dashboard"
        user={user}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />
      <StatsBar stats={stats} />
      <TicketsSection
        role={user.role}
        tickets={uiTickets}
        loading={ticketsLoading}
        error={ticketsError}
        onDismissError={clearError}
        onCreateTicket={handleCreateTicket}
        onOpenTicket={(id) => router.push(`/ticket/${id}`)}
      />
      <UserInfoCard user={user} />
      <footer className="mt-8 text-sm text-gray-500">
        <div className="rounded-md border border-dashed p-4">
          <span className="mr-2 text-xl">🎫</span>
          Manage your work with clarity. Create tickets, track progress, and
          deliver on time.
        </div>
      </footer>
    </main>
  );
}
