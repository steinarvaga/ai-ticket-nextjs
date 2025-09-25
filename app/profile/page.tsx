"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // from your repo
import type { User } from "@/lib/types"; // base type (id, name, email, role, ...)
// ^ lib/types.ts defines Role, User with optional skills/createdAt  :contentReference[oaicite:7]{index=7}

import Alerts from "./_components/Alerts";
import ProfileSummaryCard from "./_components/ProfileSummaryCard";
import ProfileDetailsCard from "./_components/ProfileDetailsCard";
import type { ProfileData, UpdatePayload } from "./_components/types";

const fetchProfile = async (): Promise<ProfileData> => {
  const res = await fetch("/api/profile", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load profile");
  // The API can return more than AuthContext stores; we capture skills/createdAt
  const data = (await res.json()) as {
    authUser: (User & { skills?: string[]; createdAt?: string }) | null;
  };
  if (!data.authUser) throw new Error("Not authenticated");
  // normalize to ensure skills/createdAt are present for the UI
  return {
    ...data.authUser,
    skills: data.authUser.skills ?? [],
    createdAt: data.authUser.createdAt ?? undefined,
  };
};

const putProfile = async (payload: UpdatePayload) => {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || "Failed to update profile");
  }
  return (await res.json()) as { success: boolean };
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useAuth(); // AuthContext has user + loading  :contentReference[oaicite:8]{index=8}

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [pageError, setPageError] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Client-side protection (in addition to middleware)
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await fetchProfile();
        if (alive) setProfile(p);
      } catch (e: unknown) {
        if (alive) {
          if (e instanceof Error) {
            setPageError(e.message);
          } else {
            setPageError("Error loading profile");
          }
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleUpdate = async (payload: UpdatePayload) => {
    setPageError("");
    setPasswordError("");
    setSaving(true);
    try {
      // local validation for password branch
      if (payload.newPassword) {
        if (!payload.currentPassword) {
          setPasswordError("Current password is required");
          return;
        }
        if ((payload.newPassword || "").length < 6) {
          setPasswordError("New password must be at least 6 characters");
          return;
        }
        if (payload.newPassword !== payload.confirmPassword) {
          setPasswordError("New passwords do not match");
          return;
        }
      }
      await putProfile(payload);
      // refresh profile view
      const fresh = await fetchProfile();
      setProfile(fresh);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setPageError(e.message);
      } else {
        setPageError("Update failed");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user || !profile) {
    // Match your Loader/daisyUI look
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg" />
          <p className="mt-4 text-base-content">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Alerts
          showSuccess={showSuccess}
          error={pageError}
          passwordError={passwordError}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ProfileSummaryCard user={profile} />
          </div>

          <div className="lg:col-span-2">
            <ProfileDetailsCard
              profile={profile}
              onSubmit={handleUpdate}
              saving={saving}
              onClearPasswordError={() => setPasswordError("")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
