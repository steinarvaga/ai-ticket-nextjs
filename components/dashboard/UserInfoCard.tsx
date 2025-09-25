"use client";
import React from "react";
import Card from "@/components/common/Card";
import Badge from "@/components/common/Badge";
import { formatDate } from "@/utils/date";
import type { User } from "@/lib/types";

export default function UserInfoCard({ user }: { user: User | null }) {
  if (!user) return null;
  const { name, email, role, skills = [], createdAt } = user;
  return (
    <Card className="mt-6 p-4">
      <h3 className="text-sm font-semibold text-gray-900">User information</h3>
      <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
        <div>
          <span className="font-medium">Name:</span> {name}
        </div>
        <div>
          <span className="font-medium">Email:</span> {email}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Role:</span>{" "}
          <Badge tone="blue">{role}</Badge>
        </div>
        <div>
          <span className="font-medium">Member since:</span>{" "}
          {createdAt
            ? new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "—"}
        </div>
      </div>
      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((s) => (
            <Badge key={s} tone="purple">
              {s}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}
