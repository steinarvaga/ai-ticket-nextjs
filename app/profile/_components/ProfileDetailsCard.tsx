import React, { useState } from "react";
import type { ProfileData, UpdatePayload } from "./types";
import ViewMode from "./ViewMode";
import EditMode from "./EditMode";

type Props = {
  profile: ProfileData;
  onSubmit: (payload: UpdatePayload) => Promise<void>;
  saving: boolean;
  onClearPasswordError: () => void;
};

export default function ProfileDetailsCard({
  profile,
  onSubmit,
  saving,
  onClearPasswordError,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-6">
          <h2 className="card-title text-2xl">Profile Details</h2>
          {!isEditing && (
            <button
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <EditMode
            initial={profile}
            saving={saving}
            onCancel={() => {
              setIsEditing(false);
              onClearPasswordError();
            }}
            onSubmit={async (payload) => {
              await onSubmit(payload);
              setIsEditing(false);
            }}
          />
        ) : (
          <ViewMode user={profile} />
        )}
      </div>
    </div>
  );
}
