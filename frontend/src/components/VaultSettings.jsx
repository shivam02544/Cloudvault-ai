import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass w-full max-w-md overflow-hidden shadow-2xl border border-white/[0.08]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.05] bg-white/[0.02]">
          <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
            Vault Configuration
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <RefreshCw size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Maintenance Mode</h4>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                      Manage your vault state and storage limits. Use the reset option if you want to start fresh with a clean slate.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Storage API</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Metadata Sync</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">ACTIVE</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group"
                >
                  <Trash2 size={14} className="group-hover:rotate-12 transition-transform" />
                  Reset Vault Data
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 border border-rose-500/20">
                    <ShieldAlert size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Critical Confirmation</h4>
                    <p className="text-rose-400/80 text-sm mt-2 font-medium leading-relaxed">
                      This action will permanently delete ALL files, tags, and sharing links. This cannot be undone.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setStep(3)}
                    className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 hover:bg-rose-500 transition-all"
                  >
                    I Understand, Continue
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full py-4 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                  >
                    Cancel Action
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white border border-rose-400/20 animate-pulse">
                    <AlertTriangle size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white uppercase tracking-tighter">Final Verification</h4>
                    <p className="text-slate-500 text-sm mt-1">
                      Are you absolutely sure you want to initialize a complete vault reset?
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="w-full py-4 bg-white text-rose-600 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isResetting ? (
                    <RefreshCw className="animate-spin h-4 w-4" />
                  ) : (
                    'CONFIRM SYSTEM RESET'
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="px-8 py-4 bg-black/20 border-t border-white/[0.03]">
          <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-widest">
            CloudVault Secure Environment v2.0
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VaultSettings;
