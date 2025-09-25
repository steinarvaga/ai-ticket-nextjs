import React from "react";

interface Props {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
}

export default function TicketStatusCard({
  total,
  todo,
  inProgress,
  completed,
}: Props) {
  const rows = [
    { label: "TODO", value: todo, klass: "progress-info", badge: "badge-info" },
    {
      label: "In Progress",
      value: inProgress,
      klass: "progress-warning",
      badge: "badge-warning",
    },
    {
      label: "Completed",
      value: completed,
      klass: "progress-success",
      badge: "badge-success",
    },
  ];
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Ticket Status Distribution</h2>
        <div className="space-y-4">
          {rows.map((r) => (
            <div className="flex justify-between items-center" key={r.label}>
              <span>{r.label}</span>
              <div className="flex items-center space-x-2">
                <progress
                  className={`progress ${r.klass} w-20`}
                  value={r.value}
                  max={total}
                ></progress>
                <span className={`badge ${r.badge}`}>{r.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
