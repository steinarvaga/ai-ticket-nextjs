import React from "react";

export default function ErrorAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="alert alert-error mb-6">
      <span>{message}</span>
    </div>
  );
}
