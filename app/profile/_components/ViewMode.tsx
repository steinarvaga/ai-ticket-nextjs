import React from "react";
import type { ProfileData } from "./types";
import { roleBadgeClass } from "./utils";

export default function ViewMode({ user }: { user: ProfileData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-base-content/70 mb-2">Name</h3>
          <p className="text-lg">{user.name}</p>
        </div>
        <div>
          <h3 className="font-semibold text-base-content/70 mb-2">Email</h3>
          <p className="text-lg">{user.email}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-base-content/70 mb-3">Skills</h3>
        {user.skills?.length ? (
          <div className="flex flex-wrap gap-2">
            {user.skills.map((s, i) => (
              <div key={`${s}-${i}`} className="badge badge-primary badge-lg">
                {s}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base-content/60 italic">No skills added yet</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-base-content/70 mb-2">Role</h3>
          <div className={`badge badge-lg ${roleBadgeClass(user.role)}`}>
            {user.role?.toUpperCase()}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-base-content/70 mb-2">
            Member Since
          </h3>
          <p className="text-lg">
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
