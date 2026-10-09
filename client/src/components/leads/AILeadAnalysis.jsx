import React from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Zap,
  RefreshCw,
} from 'lucide-react';
import Button from '../common/Button';

export default function AILeadAnalysis({
  lead,
  analysis,
  loading = false,
  error = null,
  onAnalyze,
}) {
  const getScoreColor = (score) => {
    if (score >= 70) return 'from-emerald-500 to-emerald-400';
    if (score >= 40) return 'from-amber-500 to-amber-400';
    return 'from-rose-500 to-rose-400';
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-800/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-300 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-tight">
              Gemini AI Intelligence
            </h3>
            <p className="text-[10px] text-indigo-300 font-medium">
              {analysis?.modelUsed ? `Model: ${analysis.modelUsed}` : 'Google Gemini Flash Analysis'}
            </p>
          </div>
        </div>

        {analysis?.priority && (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getPriorityBadgeClass(
              analysis.priority
            )}`}
          >
            {analysis.priority} Priority
          </span>
        )}
      </div>

      {/* Graceful Error Display */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-rose-100">AI Analysis Error</p>
            <p className="text-[11px] text-rose-200/90 leading-relaxed">{error}</p>
            <p className="text-[10px] text-rose-300/70 pt-0.5">
              Ensure GEMINI_API_KEY is configured in server/.env or retry the request.
            </p>
          </div>
        </div>
      )}

      {/* State 1: Active Processing / Loading */}
      {loading ? (
        <div className="py-10 px-4 text-center space-y-3 bg-indigo-950/40 rounded-xl border border-indigo-800/40 animate-pulse">
          <Loader2 className="w-8 h-8 text-amber-300 animate-spin mx-auto" />
          <div>
            <h4 className="text-xs font-bold text-indigo-100">
              Analyzing Lead with Gemini...
            </h4>
            <p className="text-[11px] text-indigo-300/80 mt-1 max-w-xs mx-auto">
              Evaluating deal conversion probability, requirement clarity, and next sales steps.
            </p>
          </div>
        </div>
      ) : analysis ? (
        /* State 2: Analysis Results View */
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Opportunity Score Meter */}
          <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-700/40 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-medium text-indigo-200">
                Conversion Opportunity Score
              </span>
              <span className="text-2xl font-black text-amber-300 font-mono tracking-tight">
                {analysis.score}
                <span className="text-xs font-normal text-indigo-300">/100</span>
              </span>
            </div>

            <div className="w-full bg-indigo-900/80 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-700 bg-gradient-to-r ${getScoreColor(
                  analysis.score
                )}`}
                style={{ width: `${Math.min(Math.max(analysis.score, 0), 100)}%` }}
              />
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
              Executive Assessment
            </h4>
            <p className="text-xs text-indigo-100/90 leading-relaxed bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-800/30 font-sans">
              {analysis.summary}
            </p>
          </div>

          {/* Key Analytical Drivers */}
          {analysis.reasons && analysis.reasons.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                Key Analysis Drivers
              </h4>
              <ul className="space-y-1.5 text-xs text-indigo-200">
                {analysis.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-300 shrink-0 font-bold">&bull;</span>
                    <span className="leading-snug">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Next Action */}
          {analysis.recommendedNextAction && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/30 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-300 uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Recommended Next Action
              </div>
              <p className="text-xs text-amber-100 font-medium leading-relaxed">
                {analysis.recommendedNextAction}
              </p>
            </div>
          )}

          {/* Footer Action & Timestamp */}
          <div className="flex items-center justify-between pt-2 border-t border-indigo-800/40 text-[11px] text-indigo-300/80">
            <span>
              {analysis.createdAt
                ? `Evaluated: ${new Date(analysis.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Generated just now'}
            </span>
            <button
              type="button"
              onClick={onAnalyze}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-800/60 hover:bg-indigo-700 text-indigo-100 hover:text-white transition cursor-pointer text-xs font-semibold disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" />
              Re-analyze
            </button>
          </div>
        </div>
      ) : (
        /* State 3: Unanalyzed Initial Prompt */
        <div className="space-y-4">
          <p className="text-xs text-indigo-200 leading-relaxed">
            Evaluate this sales lead with Gemini AI. Calculates qualification score (0–100), urgency priority, strategic buying drivers, and optimal next steps.
          </p>

          <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-[11px] text-indigo-300 space-y-1.5">
            <div className="font-semibold text-indigo-200">What Gemini Evaluates:</div>
            <ul className="list-disc list-inside space-y-1 text-indigo-300/90">
              <li>Stated budget alignment with requested scope</li>
              <li>Requirement clarity and purchasing urgency</li>
              <li>Prescriptive next action for your sales team</li>
            </ul>
          </div>

          <Button
            variant="primary"
            size="md"
            fullWidth={true}
            onClick={onAnalyze}
            loading={loading}
            icon={Sparkles}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold"
          >
            Analyze with AI
          </Button>
        </div>
      )}
    </div>
  );
}
