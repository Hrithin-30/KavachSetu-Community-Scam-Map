import React, { useState } from 'react';
import { X, Scale, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Language } from '../translations';
import { IdentifierType } from '../engine/normalizer';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onDisputeSuccess: (challengeId: string) => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  onClose,
  onDisputeSuccess
}) => {
  const [identifierType, setIdentifierType] = useState<IdentifierType>('phone');
  const [identifierValue, setIdentifierValue] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [proof, setProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [challengeReceipt, setChallengeReceipt] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier_type: identifierType,
          identifier_value: identifierValue,
          business_name: businessName,
          contact_email: contactEmail,
          proof
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit business dispute');
      } else {
        setChallengeReceipt(data.challenge_id);
        onDisputeSuccess(data.challenge_id);
      }
    } catch {
      setErrorMsg('Network error submitting dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setChallengeReceipt(null);
    setErrorMsg(null);
    setIdentifierValue('');
    setBusinessName('');
    setProof('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0D1322] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {challengeReceipt ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              Business Dispute Registered ({challengeReceipt})
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your identifier has immediately been stepped down from <strong className="text-red-400">KNOWN_SCAM</strong> to <strong className="text-amber-400">SUSPICIOUS (challenged: true)</strong> while our nodal officers verify your GSTIN/Telecom allocation proof.
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  Business Dispute & False-Flag Challenge
                </h3>
                <p className="text-xs text-slate-400">
                  POST /challenges • Immediate Verdict Step-Down Protection
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Type
                  </label>
                  <select
                    value={identifierType}
                    onChange={(e) => setIdentifierType(e.target.value as IdentifierType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="phone">Phone</option>
                    <option value="upi">UPI ID</option>
                    <option value="url">URL</option>
                    <option value="sender_id">Sender ID</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Business Identifier (Phone / UPI / URL)
                  </label>
                  <input
                    type="text"
                    required
                    value={identifierValue}
                    onChange={(e) => setIdentifierValue(e.target.value)}
                    placeholder="+91 98765 43210 or merchant@okaxis"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Registered Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Fresh Bakes Bengaluru Pvt Ltd"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="compliance@company.in"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Ownership Proof (GSTIN, DLT Header Certificate, or Telecom Bill Ref)
                </label>
                <textarea
                  rows={3}
                  required
                  value={proof}
                  onChange={(e) => setProof(e.target.value)}
                  placeholder="Provide GSTIN, TRAI DLT Entity Registration ID, or bank merchant VPA allocation reference..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !identifierValue.trim() || !businessName.trim() || !proof.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
                >
                  {submitting ? 'Filing Challenge...' : 'Submit Challenge (/challenges)'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
