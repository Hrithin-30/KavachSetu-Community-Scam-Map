import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, ShieldAlert, PhoneCall, Loader2 } from 'lucide-react';
import { Language } from '../translations';

interface AiAdvisorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialPrompt?: string;
  initialContext?: any;
}

export const AiAdvisorDrawer: React.FC<AiAdvisorDrawerProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  initialContext
}) => {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (queryText: string, contextData?: any) => {
    if (!queryText.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/analyze-scam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          context: contextData
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Unable to analyze right now.');
      } else {
        setAnalysis(data.analysis || 'No analysis returned.');
      }
    } catch {
      setError('Network error while contacting Cyber Safety Advisor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialPrompt) {
      setPrompt(initialPrompt);
      runAnalysis(initialPrompt, initialContext);
    }
  }, [isOpen, initialPrompt, initialContext]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">KavachSetu Cyber Safety Advisor</h3>
              <p className="text-[11px] text-slate-400">Pattern Analysis & 1930 Action Protocol</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runAnalysis(prompt, initialContext);
            }}
            className="space-y-2.5"
          >
            <label className="block text-xs font-semibold text-slate-300">
              Describe the suspicious call, SMS, UPI request, or message:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Received WhatsApp video call claiming CBI digital arrest..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Analyze</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <span>Evaluating against Indian cybercrime patterns...</span>
            </div>
          )}

          {!isLoading && analysis && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Safety Assessment & Recommended Steps</span>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                {analysis}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Lost money in a UPI/bank fraud?</span>
          <a
            href="tel:1930"
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5 hover:bg-emerald-600/30"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Dial 1930 Immediately</span>
          </a>
        </div>
      </div>
    </div>
  );
};
