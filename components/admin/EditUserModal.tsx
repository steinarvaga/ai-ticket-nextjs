import React from "react";
import type { Role } from "@/lib/types"; // :contentReference[oaicite:10]{index=10}
import type { EditUserForm } from "@/app/admin/page";

interface Props {
  isOpen: boolean;
  formData: EditUserForm | null;
  setFormData: React.Dispatch<React.SetStateAction<EditUserForm | null>>;
  newSkill: string;
  setNewSkill: React.Dispatch<React.SetStateAction<string>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
  onQuickAdd: (skill: string) => void;
  availableSkills: string[];
  loading?: boolean;
}

export default function EditUserModal({
  isOpen,
  formData,
  setFormData,
  newSkill,
  setNewSkill,
  onClose,
  onSubmit,
  onAddSkill,
  onRemoveSkill,
  onQuickAdd,
  availableSkills,
  loading,
}: Props) {
  if (!isOpen || !formData) return null;

  const remaining = availableSkills.filter((s) => !formData.skills.includes(s));

  const change =
    <K extends keyof EditUserForm>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormData((prev) =>
        prev ? { ...prev, [key]: e.target.value as EditUserForm[K] } : prev
      );

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>
        <h3 className="font-bold text-lg mb-4">Edit User</h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input
              className="input input-bordered"
              value={formData.name}
              onChange={change("name")}
              required
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              className="input input-bordered"
              value={formData.email}
              readOnly
            />
            <label className="label">
              <span className="label-text-alt">Email cannot be changed</span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Role</span>
            </label>
            <select
              className="select select-bordered"
              value={formData.role}
              onChange={change("role")}
              required
            >
              {(["user", "moderator", "admin"] as Role[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Skills */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Skills</span>
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {formData.skills.map((skill, i) => (
                <div key={i} className="badge badge-primary gap-2">
                  {skill}
                  <button
                    type="button"
                    className="btn btn-xs btn-circle btn-ghost"
                    onClick={() => onRemoveSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-3">
              <input
                className="input input-bordered flex-1"
                placeholder="Add a skill."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), onAddSkill())
                }
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={onAddSkill}
              >
                Add
              </button>
            </div>

            <div className="text-sm text-base-content/70 mb-2">Quick Add:</div>
            <div className="flex flex-wrap gap-1">
              {remaining.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="badge badge-outline badge-sm cursor-pointer hover:badge-primary"
                  onClick={() => onQuickAdd(s)}
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-action">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner" />
              ) : (
                "Update User"
              )}
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
