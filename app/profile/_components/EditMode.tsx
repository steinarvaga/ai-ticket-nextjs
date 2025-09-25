import React, { useCallback, useMemo, useState } from "react";
import type { ProfileData, UpdatePayload } from "./types";
import SkillsEditor from "./SkillsEditor";
import PasswordFields from "./PasswordFields";

type Props = {
  initial: ProfileData;
  onSubmit: (payload: UpdatePayload) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
};

export default function EditMode({
  initial,
  onSubmit,
  onCancel,
  saving,
}: Props) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [skills, setSkills] = useState<string[]>(initial.skills ?? []);
  const [newSkill, setNewSkill] = useState("");
  const [changePassword, setChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const payload = useMemo<UpdatePayload>(() => {
    const base: UpdatePayload = { name, email, skills };
    if (changePassword) {
      base.currentPassword = currentPassword || undefined;
      base.newPassword = newPassword || undefined;
      base.confirmPassword = confirmPassword || undefined;
    }
    return base;
  }, [
    name,
    email,
    skills,
    changePassword,
    currentPassword,
    newPassword,
    confirmPassword,
  ]);

  const addSkill = useCallback(() => {
    const s = newSkill.trim();
    if (!s) return;
    if (skills.includes(s)) return;
    setSkills((prev) => [...prev, s]);
    setNewSkill("");
  }, [newSkill, skills]);

  const removeSkill = useCallback((s: string) => {
    setSkills((prev) => prev.filter((x) => x !== s));
  }, []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(payload);
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Email</span>
          </label>
          <input
            type="email"
            className="input input-bordered"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <SkillsEditor
        skills={skills}
        newSkill={newSkill}
        setNewSkill={setNewSkill}
        addSkill={addSkill}
        removeSkill={removeSkill}
      />

      <div className="divider">Password</div>

      <div className="form-control">
        <label className="cursor-pointer label justify-start gap-4">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={changePassword}
            onChange={(e) => setChangePassword(e.target.checked)}
          />
          <span className="label-text font-semibold">Change Password</span>
        </label>
      </div>

      {changePassword && (
        <PasswordFields
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          onCurrentPassword={setCurrentPassword}
          onNewPassword={setNewPassword}
          onConfirmPassword={setConfirmPassword}
        />
      )}

      <div className="card-actions justify-end gap-4">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <span className="loading loading-spinner loading-sm" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}
