import { X, Trash2, AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const VaultSettings = ({ onReset, onClose }) => {
  const [step, setStep] = useState(1); // 1: Info, 2: Danger, 3: Confirm
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    const success = await onReset();
    if (success) {
      onClose();
    } else {
      setIsResetting(false);
      setStep(1);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-950/60 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className="glass-premium w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] animate-in zoom-in-95 duration-500"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05] bg-white/[0.02]">
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
            Vault Settings
          </h3>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-all bg-white/5 rounded-xl">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-10">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {step === 1 && (
              <div className="space-y-8">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg">
                    <RefreshCw size={28} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tight italic">Data Management</h4>
                    <p className="text-slate-500 text-[12px] mt-2 leading-relaxed font-bold uppercase tracking-tight opacity-70">
                      Manage your vault state and storage. Use the reset option if you want to start fresh with a clean slate.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Storage Status</span>
                    <span className="text-[8px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-black border border-emerald-500/20">ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Security Sync</span>
                    <span className="text-[8px] px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-black border border-emerald-500/20">PROTECTED</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 group active:scale-[0.98]"
                >
                  <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                  Reset Vault Data
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 bg-rose-500/10 rounded-[1.5rem] flex items-center justify-center text-rose-400 border border-rose-500/20 shadow-lg">
                    <ShieldAlert size={28} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tight italic">Critical Confirmation</h4>
                    <p className="text-rose-400/80 text-[12px] mt-2 font-bold uppercase tracking-tight leading-relaxed">
                      This action will permanently delete ALL files, tags, and sharing links. This cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-4 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-rose-600/20 hover:bg-rose-500 transition-all active:scale-[0.98]"
                  >
                    I Understand, Continue
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full py-4 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] transition-all"
                  >
                    Cancel Action
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in zoom-in-95">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 bg-rose-600 rounded-[1.5rem] flex items-center justify-center text-white border border-rose-400/20 animate-pulse shadow-lg">
                    <AlertTriangle size={28} />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-tighter italic">Final Verification</h4>
                    <p className="text-slate-500 text-[12px] mt-1 font-bold uppercase tracking-tight opacity-70">
                      Are you absolutely sure you want to delete all data?
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="w-full py-4 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-slate-100 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-[0.98]"
                >
                  {isResetting ? (
                    <RefreshCw className="animate-spin h-4 w-4" />
                  ) : (
                    'CONFIRM DATA WIPE'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-8 py-5 bg-black/40 border-t border-white/[0.05] text-center">
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.4em]">
            CloudVault Professional
          </p>
        </div>
      </div>
    </div>
  );
};

export default VaultSettings;
