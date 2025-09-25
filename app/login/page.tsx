"use client";

import { FormEventHandler, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { login } = useAuth();

  const onFormSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const remember = form.get("remember") === "on";

    try {
      const ok = await login(email, password, remember);
      if (ok) {
        router.push(next);
      } else {
        setError("Invalid credentials");
      }
    } catch {
      setError("Network Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="pt-10" onSubmit={onFormSubmit}>
      <div className="w-96 mx-auto border border-gray-300 rounded-md space-y-3 px-6 py-8">
        <div className="space-y-5">
          <div className="pb-3">
            <h2 className="text-xl font-bold text-center">Login</h2>
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
              placeholder="Password"
              className="block w-full text-sm p-3 bg-white border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 rounded"
            />
          </div>

          <label className="inline-flex items-center space-x-1.5">
            <input type="checkbox" name="remember" />
            <span className="text-gray-500 text-xs leading-5 font-bold cursor-pointer select-none">
              Remember me
            </span>
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-disabled={loading}
              className="bg-white h-10 border border-gray-400 text-gray-500 hover:border-gray-400 hover:text-black hover:cursor-pointer focus:outline-none focus:border-gray-400 rounded text-sm font-medium px-3 disabled:opacity-50"
            >
              {loading ? "Logging in…" : "Log In"}
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
