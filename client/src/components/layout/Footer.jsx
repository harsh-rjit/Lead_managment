import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 text-sm text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} AI Business Operations SaaS (OpsAI). All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 font-mono text-slate-600">
            Frontend: React 19 + Tailwind v4
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 font-mono text-slate-600">
            Backend: Node.js 22 + Express 5
          </span>
        </div>
      </div>
    </footer>
  );
}
