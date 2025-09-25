import React from "react";

interface Props {
  total: number;
  high: number;
  medium: number;
  low: number;
}

export default function TicketPriorityCard({
  total,
  high,
  medium,
  low,
}: Props) {
  const rows = [
    {
      label: "High Priority",
      value: high,
      klass: "progress-error",
      badge: "badge-error",
    },
    {
      label: "Medium Priority",
      value: medium,
      klass: "progress-warning",
      badge: "badge-warning",
    },
    {
      label: "Low Priority",
      value: low,
      klass: "progress-success",
      badge: "badge-success",
    },
  ];
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Priority Distribution</h2>
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
