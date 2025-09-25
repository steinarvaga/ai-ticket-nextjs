import React from "react";

interface Props {
  total: number;
  userCount: number;
  completed: number;
  inProgress: number;
}

export default function OverviewStats({
  total,
  userCount,
  completed,
  inProgress,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="stat bg-base-100 rounded-lg shadow">
        <div className="stat-title">Total Tickets</div>
        <div className="stat-value text-primary">{total}</div>
      </div>
      <div className="stat bg-base-100 rounded-lg shadow">
        <div className="stat-title">Total Users</div>
        <div className="stat-value text-secondary">{userCount}</div>
        <div className="stat-desc">Including yourself</div>
      </div>
      <div className="stat bg-base-100 rounded-lg shadow">
        <div className="stat-title">Completed</div>
        <div className="stat-value text-success">{completed}</div>
      </div>
      <div className="stat bg-base-100 rounded-lg shadow">
        <div className="stat-title">In Progress</div>
        <div className="stat-value text-warning">{inProgress}</div>
      </div>
    </div>
  );
}
