import { Users, FolderOpen, AlertTriangle, HardDrive, Zap } from 'lucide-react';

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
    { label: 'Total Files', value: stats?.totalFileCount || 0, icon: FolderOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Flagged Items', value: riskyCount || 0, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ── Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`glass-premium p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden group cursor-default border border-white/[0.05] hover:border-blue-500/30 transition-all hover:-translate-y-1`}
          >
            <div className={`h-10 w-10 sm:h-12 sm:w-12 ${card.bg} ${card.color} ${card.border} border rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]`}>
              <card.icon size={20} />
            </div>
            
            <p className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1 sm:mb-2">{card.label}</p>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Control Center ── */}
      <div className="glass-premium p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-white/[0.05] animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[13px] sm:text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Zap size={16} className="text-yellow-400 fill-yellow-400/20" /> System Operations
          </h3>
          <span className="hidden sm:inline-flex px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
            Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {[
            { id: 'users', label: 'User Registry', icon: Users, desc: 'Approve users and manage storage limits', color: 'blue' },
            { id: 'explorer', label: 'File Explorer', icon: FolderOpen, desc: 'View and manage all files across the platform', color: 'indigo' },
            { id: 'moderation', label: 'Safety Center', icon: AlertTriangle, desc: 'Review flagged content and security alerts', color: 'rose' }
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => onTabChange(action.id)}
              className="p-5 sm:p-6 text-left glass-card border border-white/[0.03] hover:border-blue-500/40 hover:bg-white/[0.05] rounded-2xl sm:rounded-[2rem] group transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4 mb-3 sm:mb-4">
                <div className={`h-9 w-9 sm:h-10 sm:w-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-500/10 transition-all font-sans`}>
                  <action.icon size={16} />
                </div>
                <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest">{action.label}</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed opacity-70 group-hover:opacity-100">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
