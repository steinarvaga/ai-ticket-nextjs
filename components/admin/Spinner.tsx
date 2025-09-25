import React from "react";

export default function Spinner({
  size = "lg",
}: {
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <div className="flex justify-center">
      <span className={`loading loading-spinner loading-${size}`}></span>
    </div>
  );
}
