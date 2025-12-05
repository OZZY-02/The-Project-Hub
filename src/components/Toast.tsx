"use client";

import React, { useEffect, useState } from 'react';

export default function Toast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      const msg = e?.detail?.message || e?.detail || String(e);
      setMessage(msg);
      setTimeout(() => setMessage(null), 3000);
    };

    window.addEventListener('app:toast', handler as EventListener);
    return () => window.removeEventListener('app:toast', handler as EventListener);
  }, []);

  if (!message) return null;

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="bg-black text-white px-4 py-2 rounded shadow">{message}</div>
    </div>
  );
}
