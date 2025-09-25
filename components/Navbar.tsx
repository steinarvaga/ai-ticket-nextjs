"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // don’t render until we know auth status (keeps layout simple)
  if (loading) return null;

  const isLoggedIn = Boolean(user);

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    router.push("/login");
  };

  // Shared nav links (visible when logged in)
  const authedLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/assigned", label: "Assigned" },
    { href: "/profile", label: "Profile" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <nav className="w-full border-b border-gray-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex min-h-24 items-center justify-between">
          {/* Left: Brand / Home */}
          <div className="flex items-center">
            <Link href="/" className="inline-flex items-center">
              {/* Responsive text sizes */}
              <span className="cursor-pointer select-none font-semibold text-gray-600 sm:text-base md:text-lg lg:text-xl xl:text-2xl">
                Home
              </span>
            </Link>
          </div>

          {/* Desktop center links */}
          <div className="hidden items-center md:flex">
            <ul className="flex items-center gap-6">
              {isLoggedIn &&
                authedLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="rounded-md px-2 py-2 font-semibold text-gray-600 hover:text-gray-700 sm:text-base md:text-lg lg:text-xl xl:text-2xl"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          {/* Right: Auth area (desktop) */}
          <div className="hidden items-center md:flex">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span
                  title={user?.email}
                  className="max-w-[8rem] truncate font-semibold text-gray-600 sm:max-w-[16rem] md:max-w-none sm:text-base md:text-lg lg:text-xl xl:text-2xl"
                >
                  {user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100 sm:text-base md:text-lg lg:text-xl xl:text-2xl"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="rounded-md px-2 py-1.5 font-semibold text-gray-600 hover:text-gray-700 sm:text-base md:text-lg lg:text-xl xl:text-2xl"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-md px-2 py-1.5 font-semibold text-gray-600 hover:text-gray-700 sm:text-base md:text-lg lg:text-xl xl:text-2xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile burger */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {/* Simple hamburger / close icons (no extra deps) */}
              {open ? (
                // X icon
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6l12 12M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                // Hamburger icon
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <div
          className={`md:hidden ${open ? "block" : "hidden"} pb-4`}
          onClick={() => setOpen(false)}
        >
          <ul className="space-y-2 pt-2">
            {/* When logged in, show the app links */}
            {isLoggedIn &&
              authedLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="block rounded-md px-3 py-2 text-base text-gray-700 hover:bg-gray-50"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}

            {/* Auth section (mobile) */}
            {isLoggedIn ? (
              <>
                <li className="px-3 pt-2 text-sm text-gray-600">
                  {/* Email is stacked and truncated on narrow screens */}
                  <span
                    title={user?.email}
                    className="block max-w-full truncate"
                  >
                    {user?.email}
                  </span>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-base text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-center text-base text-gray-600 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-md px-3 py-2 text-center text-base text-gray-600 hover:bg-gray-50"
                >
                  Register
                </Link>
              </div>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
