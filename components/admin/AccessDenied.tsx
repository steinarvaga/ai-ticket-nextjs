import React from "react";

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="alert alert-error">
        <span>Access denied. Admin privileges required.</span>
      </div>
    </div>
  );
}
