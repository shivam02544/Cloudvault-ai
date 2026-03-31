import { HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

const VaultStats = ({ usagePercent, maxStorage = '5 GB' }) => {
  return (
    <div className="flex flex-col gap-1.5 min-w-[120px]">
      <div className="flex items-center gap-2">
        <HardDrive className="h-3 w-3 text-slate-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Vault Storage
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 w-24 sm:w-32 bg-slate-800/80 rounded-full overflow-hidden border border-white/[0.03]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(usagePercent, usagePercent > 0 ? 1 : 0)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${
              usagePercent > 90 ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 
              usagePercent > 75 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 
              'bg-gradient-to-r from-blue-600 to-indigo-400'
            }`}
          />
        </div>
        <span className="text-[10px] font-mono font-medium text-slate-400">
          {usagePercent > 0 && usagePercent < 0.1 ? '<0.1%' : `${usagePercent.toFixed(1)}%`}
          <span className="text-slate-600 ml-1">of {maxStorage}</span>
        </span>
      </div>
    </div>
  );
};

export default VaultStats;
