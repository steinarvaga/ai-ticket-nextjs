"use client";
import React from "react";

export default function Loader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-6 text-gray-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
