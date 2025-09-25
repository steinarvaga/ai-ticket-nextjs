"use client";
import React from "react";
import clsx from "clsx";

type Variant = "primary" | "ghost" | "danger";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export default function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  const variants: Record<Variant, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60",
        variants[variant],
        className
      )}
      disabled={loading || disabled}
      {...rest}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
      )}
      {children}
    </button>
  );
}
