import { LayoutDashboard, Users, FolderOpen, AlertTriangle, HardDrive, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AdminStats = ({ stats, riskyCount, onTabChange }) => {
  const cards = [
    { label: 'Cloud Storage', value: formatBytes(stats?.totalStorageUsed || 0), icon: HardDrive, color: 'text-indigo-400', glow: 'text-glow-blue', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { label: 'Active Users', value: stats?.activeUserCount || 0, icon: Users, color: 'text-blue-400', glow: 'text-glow-blue', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Total Objects', value: stats?.totalFileCount || 0, icon: FolderOpen, color: 'text-emerald-400', glow: 'text-glow-emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Flagged Items', value: riskyCount || 0, icon: AlertTriangle, color: 'text-rose-400', glow: 'text-glow-rose', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  ];

  return (
    <div className="space-y-10">
      {/* ── Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`glass-premium p-8 rounded-[2.5rem] relative overflow-hidden group border-glow-hover cursor-default`}
          >
            {/* Background Glow */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${card.bg}`} />
            
            <div className={`h-12 w-12 ${card.bg} ${card.color} ${card.border} border rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]`}>
              <card.icon size={20} />
            </div>
            
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-2">{card.label}</p>
            <p className={`text-3xl font-black text-white tracking-tighter ${card.glow}`}>{card.value}</p>
            
            {/* Scanning Line Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
               <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-scan" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Control Center ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-premium p-10 rounded-[3rem] border border-white/[0.05]"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Zap size={16} className="text-yellow-400 fill-yellow-400/20" /> Intelligence Operations
          </h3>
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
            System Live
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { id: 'users', label: 'Identity Matrix', icon: Users, desc: 'Authorize entities and manage sector quotas', color: 'blue' },
            { id: 'explorer', label: 'Global Explorer', icon: FolderOpen, desc: 'Deep-scan all platform asset repositories', color: 'indigo' },
            { id: 'moderation', label: 'Safety Firewall', icon: AlertTriangle, desc: 'Handle intelligence-flagged safety protocols', color: 'rose' }
          ].map((action) => (
            <motion.button
              key={action.id}
              onClick={() => onTabChange(action.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-6 text-left glass-card border border-white/[0.03] hover:border-blue-500/40 hover:bg-white/[0.05] rounded-[2rem] group transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-${action.color}-400 group-hover:bg-${action.color}-500/10 transition-all duration-300 shadow-inner`}>
                  <action.icon size={16} />
                </div>
                <span className="text-[11px] font-black text-white uppercase tracking-widest">{action.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed opacity-70 group-hover:opacity-100">{action.desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminStats;
