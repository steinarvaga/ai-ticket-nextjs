import React from "react";

type Props = {
  showSuccess: boolean;
  error?: string;
  passwordError?: string;
};

export default function Alerts({ showSuccess, error, passwordError }: Props) {
  return (
    <>
      {showSuccess && (
        <div
          className="alert alert-success mb-6 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div
          className="alert alert-error mb-6 shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {passwordError && (
        <div
          className="alert alert-error mb-6 shadow-lg"
          role="alert"
          aria-live="assertive"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{passwordError}</span>
        </div>
      )}
    </>
  );
}
