import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const formattedDate = new Date(label).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1 border border-slate-800">
        <p className="text-slate-400 font-medium">{formattedDate}</p>
        <p className="text-sm font-bold text-indigo-300">
          {payload[0].value} {payload[0].value === 1 ? 'Lead' : 'Leads'}
        </p>
      </div>
    );
  }
  return null;
}

export default function LeadsOverTimeChart({ data = [] }) {
  const totalInPeriod = data.reduce((sum, item) => sum + (item.leads || 0), 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Lead Acquisition Velocity</h3>
            <p className="text-xs text-slate-500">Leads generated over the past 30 days</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 text-slate-700 self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{totalInPeriod} Total Leads</span>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
            No timeline data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="leadVelocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickFormatter={(str) => {
                  const d = new Date(str);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#leadVelocityGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
