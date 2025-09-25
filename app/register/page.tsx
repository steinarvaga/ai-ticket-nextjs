"use client";

import { FormEventHandler, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onFormSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const formData = new FormData(e.currentTarget);
        const res = await fetch("/api/users/register", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          setError("Sorry, something went wrong.");
        } else {
          const json = (await res.json()) as { success: boolean };
          if (!json.success) {
            setError("Invalid credentials.");
          } else {
            router.push("/login");
          }
        }
      } catch (err: unknown) {
        console.error(err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [router, setError]
  );

  return (
    <form className="pt-10" onSubmit={onFormSubmit}>
      <div className="w-96 mx-auto border border-gray-300 rounded-md space-y-3 px-6 py-8">
        <div className="space-y-5">
          <div className="pb-3">
            <h2 className="text-xl font-bold text-center">Registration</h2>
          </div>

          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-bold select-none">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              placeholder="Full name"
              className="block w-full text-sm p-3 bg-white border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 rounded"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-bold select-none">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="Email"
              className="block w-full text-sm p-3 bg-white border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 rounded"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-bold select-none">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Password"
              className="block w-full text-sm p-3 bg-white border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 rounded"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="skills" className="text-sm font-bold select-none">
              Skills
            </label>
            <input
              id="skills"
              name="skills"
              type="text"
              autoComplete="off"
              required
              minLength={2}
              placeholder="Skills (comma-separated, e.g., React, Node.js, MongoDB)"
              className="block w-full text-sm p-3 bg-white border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 rounded"
            />
            <p className="text-xs text-gray-500">
              Enter your technical skills separated by commas
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-white h-10 border border-gray-400 text-gray-500 hover:border-gray-400 hover:text-black focus:outline-none focus:border-gray-400 rounded text-sm font-medium px-3 disabled:opacity-50"
            >
              {loading ? "Registering…" : "Register"}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="font-medium text-xs text-red-500"
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
