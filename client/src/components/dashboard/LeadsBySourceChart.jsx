import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Share2 } from 'lucide-react';

const SOURCE_COLORS = {
  website: '#6366f1',
  referral: '#8b5cf6',
  csv: '#10b981',
  linkedin: '#0ea5e9',
  manual: '#f59e0b',
  other: '#64748b',
};

const SOURCE_LABELS = {
  website: 'Website',
  referral: 'Referral',
  csv: 'CSV Import',
  linkedin: 'LinkedIn',
  manual: 'Manual',
  other: 'Other',
};

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1 border border-slate-800">
        <p className="text-slate-400 font-medium">{data.name}</p>
        <p className="text-sm font-bold text-white">
          {data.count} {data.count === 1 ? 'Lead' : 'Leads'}
        </p>
      </div>
    );
  }
  return null;
}

export default function LeadsBySourceChart({ sourceData = {} }) {
  // Convert source map into array for Recharts
  const chartData = Object.entries(sourceData).map(([key, count]) => ({
    key,
    name: SOURCE_LABELS[key] || key,
    count: count || 0,
    color: SOURCE_COLORS[key] || '#94a3b8',
  }));

  const totalLeads = chartData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-50 border border-violet-100 text-violet-600">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Leads by Acquisition Channel</h3>
            <p className="text-xs text-slate-500">Distribution across inbound and outbound channels</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        {totalLeads === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
            No source distribution data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
