import { HardDrive, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const VaultStats = ({ usagePercent, maxStorage = '5 GB' }) => {
  return (
    <div className="flex flex-col gap-2.5 min-w-[140px] group">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm group-hover:scale-110 transition-transform">
           <HardDrive size={12} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-blue-400 transition-colors">
          Storage Sector
        </span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="h-2 w-32 sm:w-48 bg-slate-900 rounded-full overflow-hidden border border-white/[0.05] relative shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(usagePercent, usagePercent > 0 ? 1 : 0)}%` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full rounded-full relative z-10 ${
              usagePercent > 90 ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 
              usagePercent > 75 ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 
              'bg-gradient-to-r from-blue-700 via-blue-500 to-indigo-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
            }`}
          />
          {/* Animated Flow Effect */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] w-20 animate-scan pointer-events-none" style={{ animationDuration: '3s' }} />
        </div>
        
        <div className="flex flex-col">
           <span className="text-[11px] font-black font-mono text-white tracking-widest leading-none">
             {usagePercent > 0 && usagePercent < 0.1 ? '<0.1%' : `${usagePercent.toFixed(1)}%`}
           </span>
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">AVAILABLE UNIT</span>
        </div>
      </div>
    </div>
  );
};

export default VaultStats;
