import React, { useState, useEffect } from "react";

export default function Toast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleToastEvent = (e: any) => {
      setToastMessage(e.detail);
    };

    window.addEventListener("show-toast", handleToastEvent);
    return () => window.removeEventListener("show-toast", handleToastEvent);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-9999 animate-[fade-in_200ms_ease-out]">
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-[0_12px_40px_rgba(220,38,38,0.15)] flex items-start gap-3 w-80 backdrop-blur-md">
        <svg
          className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div className="text-sm font-semibold pr-2 flex-1 wrap-break-word leading-relaxed">
          {toastMessage}
        </div>
        <button
          onClick={() => setToastMessage(null)}
          className="text-red-400 hover:text-red-600 transition-colors p-1 -mt-1 -mr-2 rounded-full hover:bg-red-100"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>
    </div>
  );
}
