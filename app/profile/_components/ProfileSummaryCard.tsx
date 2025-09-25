import React from "react";
import type { ProfileData } from "./types";
import { roleBadgeClass } from "./utils";

type Props = { user: ProfileData };

export default function ProfileSummaryCard({ user }: Props) {
  const initial = (user.name?.charAt(0) || "U").toUpperCase();

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body text-center justify-center">
        <div className="avatar avatar-placeholder flex justify-center items-center">
          <div className="bg-neutral text-neutral-content w-12 rounded-full">
            <span className="text-xl">{initial}</span>
          </div>
        </div>

        <h2 className="card-title justify-center text-2xl">{user.name}</h2>
        <p className="text-base-content/70">{user.email}</p>

        <div className="mt-4">
          <div className={`badge badge-lg ${roleBadgeClass(user.role)}`}>
            {user.role?.toUpperCase()}
          </div>
        </div>

        <div className="mt-4 text-sm text-base-content/60">
          <p>Member since</p>
          <p className="font-semibold">
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
