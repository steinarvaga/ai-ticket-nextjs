import React from "react";

export type AdminTabKey = "overview" | "users" | "tickets";

interface Props {
  active: AdminTabKey;
  onChange: (key: AdminTabKey) => void;
}

export default function AdminTabs({ active, onChange }: Props) {
  const Btn = (key: AdminTabKey, label: string) => (
    <button
      key={key}
      className={`tab ${active === key ? "tab-active" : ""}`}
      role="tab"
      aria-selected={active === key}
      onClick={() => onChange(key)}
    >
      {label}
    </button>
  );

  return (
    <div className="tabs tabs-boxed mb-6" role="tablist">
      {Btn("overview", "Overview")}
      {Btn("users", "User Management")}
      {Btn("tickets", "Ticket Analytics")}
    </div>
  );
}
