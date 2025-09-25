"use client";
import React from "react";

export default function EmptyState({
  icon = "🎫",
  title = "Nothing here yet",
  subtitle,
}: {
  icon?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-gray-500">
      <div className="text-4xl">{icon}</div>
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {subtitle && <p className="max-w-md text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
