import React, { useState } from 'react';
import {
  Mail,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '../common/Card';
import Button from '../common/Button';
import { useToast } from '../common/ToastContext';
import { generateFollowUpMessage } from '../../api/leadApi';

export default function AIFollowUpCard({ lead, aiAnalysis }) {
  const [type, setType] = useState('email');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleGenerate = async () => {
    if (!lead?._id) return;
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const res = await generateFollowUpMessage(lead._id, { type, tone });
      setResult(res.data);
      toast.success('Generated follow-up message draft with Gemini.', 'Message Draft Ready');
    } catch (err) {
      const msg = err.message || 'Failed to generate follow-up message.';
      setError(msg);
      toast.error(msg, 'Generation Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const textToCopy =
      result.type === 'email' && result.subject
        ? `Subject: ${result.subject}\n\n${result.body}`
        : result.body;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.info('Message copied to clipboard.', 'Copied');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Card className="p-6 space-y-5">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              AI Follow-Up Message Generator
            </h3>
            <p className="text-xs text-slate-500">
              Personalized outreach drafts tailored from deal requirements with Gemini intelligence.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Gemini Flash
          </span>
        </div>
      </div>

      {/* Control Selectors: Type & Tone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Channel Format
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setType('email')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                type === 'email'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setType('short_message')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                type === 'short_message'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Short Message
            </button>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {type === 'email'
              ? 'Complete email with subject line, greeting & value proposition'
              : 'Concise SMS, WhatsApp, or LinkedIn InMail under 280 chars'}
          </span>
        </div>

        {/* Tone Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Conversation Tone
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setTone('professional')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                tone === 'professional'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Professional
            </button>
            <button
              type="button"
              onClick={() => setTone('friendly')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
                tone === 'friendly'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Friendly
            </button>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {tone === 'professional'
              ? 'Consultative, executive, ROI and business-centric tone'
              : 'Warm, personable, conversational, rapport-building tone'}
          </span>
        </div>
      </div>

      {/* Generate Action Button */}
      <div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleGenerate}
          loading={loading}
          icon={Sparkles}
        >
          {loading
            ? 'Generating Message...'
            : result
            ? 'Regenerate Follow-Up'
            : 'Generate Follow-Up Message'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Generation Failed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/3 mx-auto" />
          <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto" />
          <div className="h-20 bg-slate-200 rounded w-full mt-3" />
        </div>
      )}

      {/* Generated Message Display */}
      {result && !loading && (
        <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 capitalize">
                Generated {result.type.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                {result.tone} Tone
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={handleCopy}
                icon={copied ? Check : Copy}
              >
                {copied ? 'Copied!' : 'Copy Text'}
              </Button>

              <button
                type="button"
                onClick={handleGenerate}
                title="Regenerate Variation"
                className="p-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {result.type === 'email' && result.subject && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Subject Line
              </span>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 select-all">
                {result.subject}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span>Message Body</span>
              {result.type === 'short_message' && (
                <span className="font-mono text-slate-500 font-normal">
                  {result.body.length} characters
                </span>
              )}
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans select-all">
              {result.body}
            </div>
          </div>

          {result.callToAction && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
              <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold">Proposed Call to Action:</span>{' '}
                <span className="text-indigo-800">{result.callToAction}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              V1 Generation Mode: Ready for manual review and dispatch via your preferred mail client or messaging app.
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
