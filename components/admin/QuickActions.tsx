import React from "react";

interface Props {
  onUsers: () => void;
  onTickets: () => void;
  onSettings: () => void;
}

export default function QuickActions({
  onUsers,
  onTickets,
  onSettings,
}: Props) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn btn-primary" onClick={onUsers}>
            Manage Users
          </button>
          <button className="btn btn-secondary" onClick={onTickets}>
            View Analytics
          </button>
          <button className="btn btn-accent" onClick={onSettings}>
            System Settings
          </button>
        </div>
      </div>
    </div>
  );
}
