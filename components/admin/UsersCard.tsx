import React from "react";

export default function UsersCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">User Management</h2>
        {children}
      </div>
    </div>
  );
}
