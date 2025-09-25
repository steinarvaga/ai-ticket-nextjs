import React from "react";

type Props = {
  skills: string[];
  newSkill: string;
  setNewSkill: (v: string) => void;
  addSkill: () => void;
  removeSkill: (skill: string) => void;
};

export default function SkillsEditor({
  skills,
  newSkill,
  setNewSkill,
  addSkill,
  removeSkill,
}: Props) {
  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-semibold">Skills</span>
      </label>

      <div className="flex flex-wrap gap-2 mb-3">
        {skills.map((skill) => (
          <div key={skill} className="badge badge-primary gap-2">
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              className="btn btn-ghost btn-circle btn-xs"
              aria-label={`Remove skill ${skill}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add a new skill"
          className="input input-bordered flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSkill();
            }
          }}
        />
        <button
          type="button"
          onClick={addSkill}
          className="btn btn-outline"
          disabled={!newSkill.trim()}
        >
          Add
        </button>
      </div>
    </div>
  );
}
