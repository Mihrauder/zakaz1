"use client";

import { useState } from "react";

export default function AdminPage() {
  const [status, setStatus] = useState<string>("");
  const [isPolling, setIsPolling] = useState(false);

  const checkUpdates = async () => {
    try {
      const res = await fetch("/api/telegram/poll", { method: "POST" });
      const data = await res.json();
      setStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  const startPolling = () => {
    setIsPolling(true);
    const interval = setInterval(checkUpdates, 2000);
    setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
    }, 30000); // Poll for 30 seconds
  };

  return (
    <div className="container-px py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Admin Panel</h1>
      
      <div className="space-y-4">
        <button
          onClick={checkUpdates}
          className="btn-primary px-4 py-2"
        >
          Check Updates Once
        </button>
        
        <button
          onClick={startPolling}
          disabled={isPolling}
          className="btn-primary px-4 py-2 disabled:opacity-50"
        >
          {isPolling ? "Polling..." : "Start Polling (30s)"}
        </button>
        
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-white mb-2">Status:</h2>
          <pre className="text-sm text-slate-300 whitespace-pre-wrap">{status || "No status yet"}</pre>
        </div>
      </div>
    </div>
  );
}
