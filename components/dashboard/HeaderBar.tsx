"use client";

import React from "react";
import Button from "@/components/common/Button";
import type { User } from "@/lib/types";

export default function HeaderBar({
  appTitle,
  user,
  onLogout,
  loggingOut,
}: {
  appTitle: string;
  user: User | null;
  onLogout: () => Promise<void>;
  loggingOut: boolean;
}) {
  return (
    <header className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{appTitle}</h1>
        {user && (
          <p className="text-sm text-gray-600">
            Welcome back, {user.name} ({user.role})
          </p>
        )}
      </div>
    </header>
  );
}
