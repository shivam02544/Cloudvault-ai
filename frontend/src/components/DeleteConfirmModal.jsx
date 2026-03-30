import { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

/**
 * Reusable delete confirmation modal.
 * Props:
 *   filename  – name of the file being deleted
 *   onConfirm – async fn called when user confirms; receives no args
 *   onCancel  – fn called when user cancels
 */
export default function DeleteConfirmModal({ filename, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 text-slate-600 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all"
        >
          <X size={14} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <Trash2 size={22} />
          </div>

          {/* Text */}
          <h2 className="text-base font-bold text-white mb-1">Delete permanently?</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            <span className="text-slate-200 font-medium break-all">"{filename}"</span> will be removed from storage and all records.
          </p>

          {/* Warning */}
          <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
            <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-400/80 leading-snug">This action cannot be undone.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/[0.08] transition-all disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
