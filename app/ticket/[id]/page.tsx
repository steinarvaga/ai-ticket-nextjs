"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useTickets } from "@/context/TicketContext";

// --- Minimal shapes to help TS without over-coupling to backend models
type Role = "user" | "moderator" | "admin";

type UserRef =
  | { _id: string; name?: string; email?: string }
  | string
  | null
  | undefined;

type TicketStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";
type TicketPriority = "low" | "medium" | "high";

type ModeratorReply = {
  code?: string;
  explanation: string;
  repliedAt: string;
};

type ReplyPayload = {
  code?: string;
  explanation: string;
};

type Ticket = {
  _id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority?: TicketPriority;
  createdBy?: UserRef;
  assignedTo?: UserRef | null;
  relatedSkills?: string[];
  helpfulNotes?: string;
  createdAt?: string;
  deadline?: string | null;
  replyFromModerator?: ModeratorReply | null;
};

export default function TicketPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { user } = useAuth();
  const {
    selectedTicket,
    loading,
    error,
    fetchTicketById,
    updateTicket,
    replyToTicket,
    clearError,
  } = useTickets();

  // ---- Local UI state
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editData, setEditData] = useState<{
    helpfulNotes: string;
    deadline: string; // HTML datetime-local string
    relatedSkills: string[];
  }>({ helpfulNotes: "", deadline: "", relatedSkills: [] });

  const [replyData, setReplyData] = useState<{
    code: string;
    explanation: string;
    repliedAt: string;
  }>({
    code: "",
    explanation: "",
    repliedAt: "",
  });

  const toLocal = (d?: string | Date | null) => {
    if (!d) return "—";
    const dt = typeof d === "string" ? new Date(d) : d;
    return Number.isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
  };

  // ---- Load on mount / id change
  useEffect(() => {
    if (id) {
      void fetchTicketById(id);
    }
  }, [id, fetchTicketById]);

  // ---- When ticket loads, seed edit form
  useEffect(() => {
    if (selectedTicket) {
      setEditData({
        helpfulNotes: selectedTicket.helpfulNotes ?? "",
        deadline: selectedTicket.deadline
          ? new Date(selectedTicket.deadline).toISOString().slice(0, 16)
          : "",
        relatedSkills: selectedTicket.relatedSkills ?? [],
      });
    }
  }, [selectedTicket]);

  // ---- Permission helpers (same logic, typed)
  const canEdit = useMemo(() => {
    if (!user || !selectedTicket) return false;
    const isOwner =
      typeof selectedTicket.createdBy === "object" &&
      selectedTicket.createdBy?._id === user._id;
    return user.role !== "user" || isOwner;
  }, [user, selectedTicket]);

  const canReply = useMemo(() => {
    return !!user && (user.role === "admin" || user.role === "moderator");
  }, [user]);

  // ---- UI helpers from the old page
  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority?.toLowerCase()) {
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

  const getStatusBadgeClass = (status?: TicketStatus) => {
    switch (status) {
      case "TODO":
        return "badge-ghost";
      case "IN_PROGRESS":
        return "badge-info";
      case "COMPLETED":
        return "badge-success";
      default:
        return "badge-ghost";
    }
  };

  const handleBack = () => router.push("/dashboard");

  const handleSkillsChange = (skillsString: string) => {
    const arr =
      skillsString
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    setEditData((p) => ({ ...p, relatedSkills: arr }));
  };

  const handleEditSubmit: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);
    try {
      // Build the payload in the shape your context expects
      const payload = {
        ticketId: String(id),
        helpfulNotes: editData.helpfulNotes,
        relatedSkills: editData.relatedSkills,
        // your schema accepts string | Date; sending Date is fine
        ...(editData.deadline ? { deadline: new Date(editData.deadline) } : {}),
      };

      console.log("1) TICKET-ID-PAGE-PAYLOAD", payload.helpfulNotes);

      // ✅ App Router signature: one object payload
      await updateTicket(payload);

      setIsEditing(false);
      alert("Ticket updated successfully!");
    } catch (err) {
      console.error("Failed to update ticket:", err);
      alert("Failed to update ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit: React.FormEventHandler<HTMLFormElement> = async (
    e
  ) => {
    e.preventDefault();
    if (!id) return;

    if (!replyData.explanation.trim()) {
      alert("Please provide an explanation");
      return;
    }

    setSubmitting(true);
    try {
      // ✅ Match the legacy signature: (ticketId, data)
      const payload: ReplyPayload = {
        explanation: replyData.explanation,
        ...(replyData.code.trim() ? { code: replyData.code } : {}),
      };

      await replyToTicket({
        ticketId: String(id),
        code: replyData.code || undefined,
        explanation: replyData.explanation,
      });

      // Ensure UI shows the new reply immediately
      await fetchTicketById(String(id));

      setReplyData({ code: "", explanation: "", repliedAt: "" });
      setIsReplying(false);
      alert("Reply added successfully!");
    } catch (err) {
      console.error("Failed to add reply:", err);
      alert("Failed to add reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Render states
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-center items-center py-12">
          <span className="loading loading-spinner loading-lg" />
          <span className="ml-4 text-lg">Loading ticket details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
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
          <button onClick={clearError} className="btn btn-sm btn-ghost">
            Dismiss
          </button>
        </div>
        <button onClick={handleBack} className="btn btn-neutral">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!selectedTicket) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <p className="text-lg text-base-content/60 mb-6">Ticket not found</p>
          <button onClick={handleBack} className="btn btn-neutral">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const t = selectedTicket;

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-6 bg-base-200 rounded-lg">
        <button onClick={handleBack} className="btn btn-neutral">
          ← Back to Dashboard
        </button>
        <div className="flex gap-4">
          {canEdit && (
            <button
              onClick={() => setIsEditing((v) => !v)}
              className={`btn ${isEditing ? "btn-ghost" : "btn-primary"}`}
            >
              {isEditing ? "Cancel Edit" : "Edit Ticket"}
            </button>
          )}
          {canReply && !t.replyFromModerator && (
            <button
              onClick={() => setIsReplying((v) => !v)}
              className={`btn ${isReplying ? "btn-ghost" : "btn-success"}`}
            >
              {isReplying ? "Cancel Reply" : "Reply to Ticket"}
            </button>
          )}
        </div>
      </div>

      {/* Main Ticket Details */}
      <div className="card bg-base-100 shadow-lg mb-8">
        <div className="card-body">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-base-content mb-4">
                {t.title}
              </h1>
              <div className="flex gap-3 mb-4">
                {t.priority && (
                  <div
                    className={`badge ${getPriorityBadgeClass(
                      t.priority
                    )} badge-lg font-bold`}
                  >
                    {t.priority.toUpperCase()} PRIORITY
                  </div>
                )}
                <div
                  className={`badge ${getStatusBadgeClass(t.status)} badge-lg`}
                >
                  {t.status.replace("_", " ")}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-base-content mb-3">
              Description
            </h3>
            <div className="bg-base-200 p-4 rounded-lg">
              <p className="text-base-content leading-relaxed whitespace-pre-wrap">
                {t.description}
              </p>
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-base-content mb-1">
                  Created By
                </h4>
                <p className="text-base-content/70">
                  {typeof t.createdBy === "object"
                    ? t.createdBy?.name
                    : "Unknown"}{" "}
                  (
                  {typeof t.createdBy === "object"
                    ? t.createdBy?.email ?? "No email"
                    : "No email"}
                  )
                </p>
              </div>
              {t.assignedTo && (
                <div>
                  <h4 className="font-semibold text-base-content mb-1">
                    Assigned To
                  </h4>
                  <p className="text-base-content/70">
                    {typeof t.assignedTo === "object"
                      ? t.assignedTo?.name
                      : "—"}
                    {typeof t.assignedTo === "object" && t.assignedTo?.email
                      ? ` (${t.assignedTo.email})`
                      : ""}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-base-content mb-1">
                  Created Date
                </h4>
                <p className="text-base-content/70">
                  {t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}
                </p>
              </div>
              {t.deadline && (
                <div>
                  <h4 className="font-semibold text-base-content mb-1">
                    Deadline
                  </h4>
                  <p className="text-base-content/70">
                    {t.deadline ? new Date(t.deadline).toLocaleString() : "—"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Helpful Notes */}
          {!!t.helpfulNotes && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-base-content mb-3">
                AI Analysis & Helpful Notes
              </h3>
              <div className="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="font-bold">AI Analysis</h4>
                  <div className="text-sm whitespace-pre-wrap">
                    {t.helpfulNotes}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Related Skills */}
          {t.relatedSkills && t.relatedSkills.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-base-content mb-3">
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {t.relatedSkills.map((skill, idx) => (
                  <div key={idx} className="badge badge-outline badge-lg">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Moderator Reply */}
          {t.replyFromModerator && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-base-content mb-3">
                Moderator Reply
              </h3>
              <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                  {t.replyFromModerator.code && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-base-content mb-2">
                        Code Solution
                      </h4>
                      <div className="mockup-code">
                        <pre className="text-sm">
                          <code>{t.replyFromModerator.code}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-base-content mb-2">
                      Explanation
                    </h4>
                    <p className="text-base-content/80 leading-relaxed whitespace-pre-wrap">
                      {t.replyFromModerator.explanation}
                    </p>
                  </div>
                  <div className="mt-4 text-sm text-base-content/60">
                    <strong>Replied on:</strong>{" "}
                    {toLocal(t.replyFromModerator?.repliedAt)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="card bg-base-100 shadow-lg mb-8">
          <div className="card-body">
            <h3 className="card-title text-xl mb-6">Edit Ticket</h3>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Helpful Notes
                  </span>
                </label>
                <textarea
                  value={editData.helpfulNotes}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, helpfulNotes: e.target.value }))
                  }
                  placeholder="Add helpful notes, troubleshooting steps, or additional information..."
                  rows={4}
                  className="textarea textarea-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Deadline</span>
                </label>
                <input
                  type="datetime-local"
                  value={editData.deadline}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, deadline: e.target.value }))
                  }
                  className="input input-bordered w-full"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Related Skills
                  </span>
                </label>
                <input
                  type="text"
                  value={editData.relatedSkills.join(", ")}
                  onChange={(e) => handleSkillsChange(e.target.value)}
                  placeholder="React, Node.js, MongoDB, etc. (comma-separated)"
                  className="input input-bordered w-full"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    Enter skills separated by commas
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`btn btn-primary ${submitting ? "loading" : ""}`}
                >
                  {submitting ? "Updating..." : "Update Ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reply Form */}
      {isReplying && (
        <div className="card bg-base-100 shadow-lg mb-8">
          <div className="card-body">
            <h3 className="card-title text-xl mb-6">Reply to Ticket</h3>
            <form onSubmit={handleReplySubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Code Solution (optional)
                  </span>
                </label>
                <textarea
                  value={replyData.code}
                  onChange={(e) =>
                    setReplyData((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="Paste code solution here..."
                  rows={6}
                  className="textarea textarea-bordered w-full font-mono text-sm"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Explanation *
                  </span>
                </label>
                <textarea
                  value={replyData.explanation}
                  onChange={(e) =>
                    setReplyData((p) => ({ ...p, explanation: e.target.value }))
                  }
                  placeholder="Provide a detailed explanation of the solution…"
                  rows={4}
                  className="textarea textarea-bordered w-full"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`btn btn-success ${submitting ? "loading" : ""}`}
                >
                  {submitting ? "Submitting..." : "Submit Reply"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
