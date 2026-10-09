import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const STATUS_CONFIG = {
  new: { label: 'New', color: '#3b82f6' },
  contacted: { label: 'Contacted', color: '#06b6d4' },
  qualified: { label: 'Qualified', color: '#8b5cf6' },
  proposal_sent: { label: 'Proposal Sent', color: '#f59e0b' },
  won: { label: 'Closed Won', color: '#10b981' },
  lost: { label: 'Closed Lost', color: '#ef4444' },
};

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1 border border-slate-800">
        <p className="text-slate-400 font-medium">{data.name}</p>
        <p className="text-sm font-bold text-white">
          {data.value} {data.value === 1 ? 'Lead' : 'Leads'}
        </p>
      </div>
    );
  }
  return null;
}

export default function LeadStatusDistributionChart({ statusData = {} }) {
  const chartData = Object.entries(statusData)
    .filter(([_, count]) => count > 0)
    .map(([key, count]) => {
      const config = STATUS_CONFIG[key] || { label: key, color: '#94a3b8' };
      return {
        name: config.label,
        value: count,
        color: config.color,
      };
    });

  const totalLeads = Object.values(statusData).reduce((sum, v) => sum + (v || 0), 0);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pipeline Stage Distribution</h3>
            <p className="text-xs text-slate-500">Breakdown of leads across sales stages</p>
          </div>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        {totalLeads === 0 || chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
            No pipeline stage data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} />
                ))}
              </Pie>
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
