import React from "react";

type Props = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  onCurrentPassword: (v: string) => void;
  onNewPassword: (v: string) => void;
  onConfirmPassword: (v: string) => void;
};

export default function PasswordFields({
  currentPassword,
  newPassword,
  confirmPassword,
  onCurrentPassword,
  onNewPassword,
  onConfirmPassword,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Current Password</span>
        </label>
        <input
          type="password"
          className="input input-bordered"
          value={currentPassword}
          onChange={(e) => onCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">New Password</span>
        </label>
        <input
          type="password"
          className="input input-bordered"
          value={newPassword}
          onChange={(e) => onNewPassword(e.target.value)}
          minLength={6}
          required
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text">Confirm Password</span>
        </label>
        <input
          type="password"
          className="input input-bordered"
          value={confirmPassword}
          onChange={(e) => onConfirmPassword(e.target.value)}
          required
        />
      </div>
    </div>
  );
}
