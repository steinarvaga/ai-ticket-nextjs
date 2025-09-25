"use client";

import React, { useState } from "react";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import { toLocalDatetimeMin } from "@/utils/date";

function toLocalDatetimeInputValue(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

const now = new Date();
const plus7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

export default function TicketForm({
  onCreate,
  onCancel,
  submitting,
}: {
  onCreate: (
    payload: { title: string; description: string; deadline?: string | null },
    reset: () => void
  ) => Promise<void> | void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<string>(
    toLocalDatetimeInputValue(plus7Days)
  );

  const min = toLocalDatetimeInputValue(now);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reset = () => {
      setTitle("");
      setDescription("");
      setDeadline("");
    };
    await onCreate({ title, description, deadline: deadline || null }, reset);
  };

  return (
    <Card className="mb-4 p-4">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">
            Deadline (optional)
          </label>
          <input
            type="datetime-local"
            min={min}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            If not specified, the backend defaults the deadline to 7 days from
            creation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" loading={submitting}>
            Create Ticket
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
