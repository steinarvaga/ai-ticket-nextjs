"use client";
import React from "react";
import Card from "@/components/common/Card";

export type Stats = {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
};

export default function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: "Total Tickets", value: stats.total },
    { label: "To Do", value: stats.todo },
    { label: "In Progress", value: stats.inProgress },
    { label: "Completed", value: stats.completed },
  ];
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value }) => (
        <Card key={label} className="p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500">
            {label}
          </div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {value ?? 0}
          </div>
        </Card>
      ))}
    </div>
  );
}
