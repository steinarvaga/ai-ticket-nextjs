"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useTickets,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "@/context/TicketContext";

/** Local filter types (avoid `any`) */
type StatusFilter = "all" | TicketStatus;
type PriorityFilter =
  | "all"
  | Extract<TicketPriority, "low" | "medium" | "high">;

export default function AssignedPage() {
  const { user } = useAuth();
  const {
    tickets,
    loading,
    error,
    fetchTickets,
    updateTicket,
    replyToTicket,
    getAssignedTickets,
    clearError,
  } = useTickets();

  /** -------- Local UI state -------- */
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [filterPriority, setFilterPriority] = useState<PriorityFilter>("all");
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyForm, setReplyForm] = useState<{
    code: string;
    explanation: string;
  }>({
    code: "",
    explanation: "",
  });

  /** -------- Effects: initial fetch & transient error clear -------- */
  useEffect(() => {
    void fetchTickets(); // load all tickets once
  }, [fetchTickets]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => clearError(), 5000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  /** -------- Derived data -------- */
  const assignedTickets = useMemo<Ticket[]>(
    () => (user ? getAssignedTickets(user._id) : []),
    [user, getAssignedTickets]
  );

  const filteredTickets = useMemo<Ticket[]>(
    () =>
      assignedTickets.filter((t) => {
        const statusOk = filterStatus === "all" || t.status === filterStatus;
        const priorityOk =
          filterPriority === "all" || t.priority === filterPriority;
        return statusOk && priorityOk;
      }),
    [assignedTickets, filterStatus, filterPriority]
  );

  /** -------- UI helpers (badges, dates) -------- */
  const priorityTone = (p?: TicketPriority) => {
    switch (p) {
      case "high":
        return "badge-error";
      case "medium":
        return "badge-warning";
      case "low":
        return "badge-success";
      default:
        return "badge-ghost";
    }
  };

  const statusTone = (s: TicketStatus) => {
    switch (s) {
      case "TODO":
        return "badge-neutral";
      case "IN_PROGRESS":
        return "badge-info";
      case "COMPLETED":
        return "badge-success";
      default:
        return "badge-ghost";
    }
  };

  const fmt = (iso?: Date | string | null) => {
    if (!iso) return "—";
    const d = typeof iso === "string" ? new Date(iso) : iso;
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  /** -------- Actions -------- */
  const handleStatusUpdate = async (
    ticketId: string,
    newStatus: TicketStatus
  ) => {
    // App Router signature: pass a single payload object shaped for TicketContext.updateTicket
    await updateTicket({ ticketId, status: newStatus }); // uses typed schema in context
  };

  const handleReplySubmit: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const code = replyForm.code.trim();
    const explanation = replyForm.explanation.trim();
    if (!code && !explanation) return;

    await replyToTicket({
      ticketId: selectedTicket._id,
      code: code || undefined,
      explanation: explanation || undefined,
    });

    setReplyForm({ code: "", explanation: "" });
    setSelectedTicket(null);
    setShowReplyModal(false);
  };

  /** -------- Render -------- */
  if (loading && tickets.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content mb-2">
          Assigned Tickets
        </h1>
        <p className="text-base-content/70">Manage tickets assigned to you</p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-error mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
          <button className="btn btn-sm btn-ghost" onClick={clearError}>
            ×
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card bg-base-200 mb-6">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Status</span>
              </label>
              <select
                className="select select-bordered w-full max-w-xs"
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as StatusFilter)
                }
              >
                <option value="all">All Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Priority</span>
              </label>
              <select
                className="select select-bordered w-full max-w-xs"
                value={filterPriority}
                onChange={(e) =>
                  setFilterPriority(e.target.value as PriorityFilter)
                }
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Results</span>
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-base-content/70">
                  Showing {filteredTickets.length} of {assignedTickets.length}{" "}
                  tickets
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets grid */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl text-base-content/20 mb-4">📋</div>
          <h3 className="text-xl font-semibold text-base-content mb-2">
            No Assigned Tickets
          </h3>
          <p className="text-base-content/70">
            {assignedTickets.length === 0
              ? "You don't have any tickets assigned to you yet."
              : "No tickets match your current filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <div key={ticket._id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                {/* Header + actions */}
                <div className="flex justify-between items-start mb-3">
                  <h2 className="card-title text-lg">{ticket.title}</h2>
                  <div className="dropdown dropdown-end">
                    <label
                      tabIndex={0}
                      className="btn btn-ghost btn-sm btn-square"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="w-4 h-4 stroke-current"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </label>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                    >
                      <li>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowReplyModal(true);
                          }}
                        >
                          Reply to Ticket
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleStatusUpdate(ticket._id, "IN_PROGRESS")
                          }
                        >
                          Mark In Progress
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() =>
                            handleStatusUpdate(ticket._id, "COMPLETED")
                          }
                        >
                          Mark Completed
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <div
                    className={`badge ${priorityTone(
                      ticket.priority
                    )} badge-sm`}
                  >
                    {ticket.priority?.toUpperCase()}
                  </div>
                  <div
                    className={`badge ${statusTone(ticket.status)} badge-sm`}
                  >
                    {ticket.status.replace("_", " ")}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-base-content/80 mb-3 line-clamp-3">
                  {ticket.description}
                </p>

                {/* Skills */}
                {ticket.relatedSkills && ticket.relatedSkills.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-base-content/60 mb-1">
                      Required Skills:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ticket.relatedSkills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="badge badge-outline badge-xs"
                        >
                          {skill}
                        </span>
                      ))}
                      {ticket.relatedSkills.length > 3 && (
                        <span className="badge badge-outline badge-xs">
                          +{ticket.relatedSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="text-xs text-base-content/60">
                  <div>Created: {fmt(ticket.createdAt)}</div>
                  {ticket.deadline && (
                    <div>Deadline: {fmt(ticket.deadline)}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply modal */}
      {showReplyModal && selectedTicket && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Reply to: {selectedTicket.title}
            </h3>

            <form onSubmit={handleReplySubmit}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Code Solution (Optional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-32 font-mono text-sm"
                  placeholder="// Your code solution here."
                  value={replyForm.code}
                  onChange={(e) =>
                    setReplyForm((p) => ({ ...p, code: e.target.value }))
                  }
                />
              </div>

              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Explanation</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Explain your solution or provide additional context."
                  value={replyForm.explanation}
                  onChange={(e) =>
                    setReplyForm((p) => ({ ...p, explanation: e.target.value }))
                  }
                />
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyForm({ code: "", explanation: "" });
                    setSelectedTicket(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    loading ||
                    (!replyForm.code.trim() && !replyForm.explanation.trim())
                  }
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    "Send Reply"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
