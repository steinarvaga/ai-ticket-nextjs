import React from "react";
import type { User } from "@/lib/types"; // :contentReference[oaicite:9]{index=9}

interface Props {
  users: User[];
  onEdit: (u: User) => void;
}

export default function UsersTable({ users, onEdit }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Skills</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(users || []).map((u) => (
            <tr key={u._id}>
              <td>
                <div className="flex items-center space-x-3">
                  <div className="avatar placeholder">
                    <div className="bg-neutral-focus text-neutral-content rounded-full w-12">
                      <span>{u.name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="font-bold">{u.name}</div>
                </div>
              </td>
              <td>{u.email}</td>
              <td>
                <div
                  className={`badge ${
                    u.role === "admin"
                      ? "badge-error"
                      : u.role === "moderator"
                      ? "badge-warning"
                      : "badge-info"
                  }`}
                >
                  {u.role}
                </div>
              </td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {(u.skills || []).slice(0, 3).map((s, i) => (
                    <div key={i} className="badge badge-outline badge-sm">
                      {s}
                    </div>
                  ))}
                  {(u.skills || []).length > 3 && (
                    <div className="badge badge-ghost badge-sm">
                      +{(u.skills || []).length - 3} more
                    </div>
                  )}
                </div>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => onEdit(u)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
