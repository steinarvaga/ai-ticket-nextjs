"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTickets } from "@/context/TicketContext";
import type { Role, User } from "@/lib/types"; // your shared types :contentReference[oaicite:4]{index=4}

import AdminHeader from "@/components/admin/AdminHeader";
import AdminTabs, { AdminTabKey } from "@/components/admin/AdminTabs";
import OverviewStats from "@/components/admin/OverviewStats";
import QuickActions from "@/components/admin/QuickActions";
import UsersCard from "@/components/admin/UsersCard";
import UsersTable from "@/components/admin/UsersTable";
import EditUserModal from "@/components/admin/EditUserModal";
import TicketStatusCard from "@/components/admin/TicketStatusCard";
import TicketPriorityCard from "@/components/admin/TicketPriorityCard";
import ErrorAlert from "@/components/admin/ErrorAlert";
import Spinner from "@/components/admin/Spinner";
import AccessDenied from "@/components/admin/AccessDenied";

// Local DTO for editing (immutable email)
export interface EditUserForm {
  _id: string;
  name: string;
  email: string;
  role: Role;
  skills: string[];
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth(); // :contentReference[oaicite:5]{index=5}
  const { getTicketStats } = useTickets(); // :contentReference[oaicite:6]{index=6}

  const [activeTab, setActiveTab] = useState<AdminTabKey>("overview");

  // --- Users state (client-managed; API-based) ---
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [newSkill, setNewSkill] = useState<string>("");

  const availableSkills = useMemo<string[]>(
    () => [
      "React",
      "Node.js",
      "MongoDB",
      "Express",
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "Authentication",
      "Database",
      "API Development",
      "Frontend",
      "Backend",
      "Full Stack",
      "DevOps",
      "AWS",
      "Docker",
    ],
    []
  );

  // --- Protection: only admin can access this page ---
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      // Optional: send non-admins away, or show access denied.
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  // --- Fetch users (assumes GET /api/users exists per your structure)
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const res = await fetch("/api/users", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setUsersError(body?.message || body?.error || `HTTP ${res.status}`);
        return;
      }
      const data = (await res.json()) as { users: User[] };
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      setUsersError(
        err instanceof Error ? err.message : "Failed to load users."
      );
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      fetchUsers();
    }
  }, [authLoading, user, fetchUsers]);

  // --- Edit handlers ---
  const startEdit = (u: User) => {
    setEditingUser({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      skills: u.skills || [],
    });
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (!s || !editingUser) return;
    if (!editingUser.skills.includes(s)) {
      setEditingUser({ ...editingUser, skills: [...editingUser.skills, s] });
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      skills: editingUser.skills.filter((x) => x !== skill),
    });
  };

  const quickAddSkill = (skill: string) => {
    if (!editingUser) return;
    if (!editingUser.skills.includes(skill)) {
      setEditingUser({
        ...editingUser,
        skills: [...editingUser.skills, skill],
      });
    }
  };

  // --- Update user (assumes PUT /api/users/[id]) :contentReference[oaicite:8]{index=8} ---
  const submitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setUsersLoading(true);
      const res = await fetch(`/api/users/${editingUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingUser.name,
          role: editingUser.role,
          skills: editingUser.skills,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setUsersError(body?.message || body?.error || `HTTP ${res.status}`);
        return;
      }
      // Optimistic local update
      setUsers((prev) =>
        prev.map((u) =>
          u._id === editingUser._id
            ? {
                ...u,
                name: editingUser.name,
                role: editingUser.role,
                skills: editingUser.skills,
              }
            : u
        )
      );
      setEditingUser(null);
    } catch (err) {
      setUsersError(
        err instanceof Error ? err.message : "Failed to update user."
      );
    } finally {
      setUsersLoading(false);
    }
  };

  // --- Derived data ---
  const ticketStats = getTicketStats();
  const totalUsers = (users?.length ?? 0) + 1; // include self, keeping parity with your prior UX

  // While auth is verifying, show a neutral loader
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // If user exists but is not admin (defensive; middleware may handle earlier)
  if (!user || user.role !== "admin") {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="container mx-auto">
        <AdminHeader />

        {usersError && <ErrorAlert message={usersError} />}

        <AdminTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" && (
          <div className="space-y-6">
            <OverviewStats
              total={ticketStats.total}
              completed={ticketStats.completed}
              inProgress={ticketStats.inProgress}
              userCount={totalUsers}
            />
            <QuickActions
              onUsers={() => setActiveTab("users")}
              onTickets={() => setActiveTab("tickets")}
              onSettings={() => {
                // TODO: route to /settings or open a drawer
              }}
            />
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            {usersLoading && <Spinner size="lg" />}
            <UsersCard>
              <UsersTable users={users} onEdit={startEdit} />
            </UsersCard>
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TicketStatusCard
                total={ticketStats.total}
                todo={ticketStats.todo}
                inProgress={ticketStats.inProgress}
                completed={ticketStats.completed}
              />
              <TicketPriorityCard
                total={ticketStats.total}
                high={ticketStats.high}
                medium={ticketStats.medium}
                low={ticketStats.low}
              />
            </div>
          </div>
        )}

        <EditUserModal
          isOpen={!!editingUser}
          formData={editingUser}
          setFormData={setEditingUser}
          newSkill={newSkill}
          setNewSkill={setNewSkill}
          onClose={() => setEditingUser(null)}
          onSubmit={submitEdit}
          onAddSkill={addSkill}
          onRemoveSkill={removeSkill}
          onQuickAdd={quickAddSkill}
          availableSkills={availableSkills}
          loading={usersLoading}
        />
      </div>
    </div>
  );
}
