import { LayoutDashboard, Users, FolderOpen, AlertTriangle, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AdminStats = ({ stats, riskyCount, onTabChange }) => {
  const cards = [
    { label: 'Cloud Storage', value: formatBytes(stats?.totalStorageUsed || 0), icon: HardDrive, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { label: 'Active Users', value: stats?.activeUserCount || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Total Objects', value: stats?.totalFileCount || 0, icon: FolderOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Flagged Items', value: riskyCount || 0, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 border border-white/[0.05] relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity`}>
              <card.icon size={64} />
            </div>
            
            <div className={`h-10 w-10 ${card.bg} ${card.color} ${card.border} border rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <card.icon size={18} />
            </div>
            
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] mb-1">{card.label}</p>
            <p className="text-2xl font-black text-white tracking-tight">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="glass p-8 border border-white/[0.05] rounded-[2rem]">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <LayoutDashboard size={14} className="text-blue-400" /> Administrative Operations
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            { id: 'users', label: 'Identity Management', icon: Users, desc: 'Manage user access and quotas' },
            { id: 'explorer', label: 'Storage Explorer', icon: FolderOpen, desc: 'Browse all platform assets' },
            { id: 'moderation', label: 'AI Review Queue', icon: AlertTriangle, desc: 'Handle flagged content' }
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => onTabChange(action.id)}
              className="flex-1 min-w-[200px] p-4 text-left glass-card border border-white/[0.03] hover:border-blue-500/30 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                  <action.icon size={14} />
                </div>
                <span className="text-xs font-bold text-slate-200">{action.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
