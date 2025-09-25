"use client";
import React from "react";
import Button from "./Button";

export default function ErrorAlert({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss?: () => void;
}) {
  if (!message) return null;
  return (
    <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <div className="flex items-start justify-between gap-4">
        <p className="leading-5">{message}</p>
        {onDismiss && (
          <Button variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
