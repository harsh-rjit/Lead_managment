import React from 'react';
import { Layers, Database, Shield, Bot, FileSpreadsheet, BarChart3, CheckCircle } from 'lucide-react';

export default function BlueprintPage() {
  const sections = [
    {
      title: '1. Multi-Tenant Isolation',
      icon: Shield,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      description:
        'Logical isolation where every record in MongoDB has an organizationId. JWT tokens embed the verified organizationId, ensuring strict tenant boundaries in all database queries.',
    },
    {
      title: '2. Layered Architecture',
      icon: Layers,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      description:
        'Separation of concerns: Express Routes -> Controllers (HTTP, status codes) -> Services (Business logic, AI, DB) -> Models (Mongoose Schemas).',
    },
    {
      title: '3. AI Lead Operations (Gemini)',
      icon: Bot,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      description:
        'Automated scoring (0-100), intent classification (high/medium/low), and personalized follow-up message generation using Google Gemini with structured JSON outputs.',
    },
    {
      title: '4. Memory-Safe CSV Import',
      icon: FileSpreadsheet,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      description:
        'Streaming file uploads using Multer and csv-parser with Zod row-level validation and MongoDB bulk insertMany to safely handle large files without memory crashes.',
    },
    {
      title: '5. Analytics Aggregations',
      icon: BarChart3,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      description:
        'High-performance MongoDB Aggregation Pipelines calculating conversion funnels, rep performance, and lead source metrics directly on the database engine.',
    },
    {
      title: '6. RBAC Security Hierarchy',
      icon: Database,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      description:
        'Three roles (Admin, Manager, Sales) enforced through Express route middleware and scoped query guards.',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          AI Business Operations SaaS — Architecture Blueprint
        </h1>
        <p className="text-slate-600 mt-1">
          High-level design and engineering foundations approved for upcoming V1 milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>

      <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100">
        <h3 className="font-bold text-indigo-950 text-base mb-2">Current Implementation Status</h3>
        <ul className="space-y-2 text-sm text-indigo-900">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Frontend React 19 + Vite + Tailwind CSS v4 layout operational</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Backend Node.js 22 + Express 5 ES Module server operational</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Axios reusable client with interceptors configured</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>CORS & environment variables (.env) connected and validated</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Live Health Check endpoint verified (<code>GET /api/health</code>)</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
