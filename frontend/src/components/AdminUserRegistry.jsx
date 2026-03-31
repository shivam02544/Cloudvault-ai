import { Users, ShieldCheck, UserX, UserCheck, Bell, Sliders, ChevronDown, ChevronUp, Loader2, Clock, CheckCircle2, XCircle, Activity, FolderOpen } from 'lucide-react';
import { useState } from 'react';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StatusBadge = ({ status }) => {
  const configs = {
    suspended: { icon: XCircle, text: 'Suspended', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    pending: { icon: Clock, text: 'Reviewing', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    denied: { icon: XCircle, text: 'Denied', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    active: { icon: CheckCircle2, text: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
  };
  const config = configs[status] || configs.active;
  
  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all duration-500 ${config.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.color.split(' ')[1].replace('text-', 'bg-')} animate-pulse`} />
      {config.text}
    </span>
  );
};

const UserRegistry = ({ users, loading, suspendingId, onAction, onNotify, onLimits }) => {
  const [expandedId, setExpandedId] = useState(null);

  if (loading && users.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center gap-6 glass-premium rounded-[2rem] sm:rounded-[3rem] border border-white/[0.05]">
        <div className="p-4 bg-blue-500/10 rounded-2xl">
            <Loader2 className="animate-spin text-blue-400" size={32} />
        </div>
        <p className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Loading User Data...</p>
      </div>
    );
  }

  return (
    <div className="glass-premium rounded-[2rem] sm:rounded-[3rem] border border-white/[0.05] overflow-hidden">
      <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
        <div>
          <h2 className="text-[13px] sm:text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Users size={16} className="text-blue-400" /> User Management
          </h2>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            {users.length} Registered Users
          </p>
        </div>
        <div className="h-9 w-9 sm:h-10 sm:w-10 bg-slate-900/50 rounded-xl flex items-center justify-center text-slate-500 border border-white/5">
            <Activity size={16} />
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {users.map((user) => (
          <div 
            key={user.userId}
            className={`group transition-all ${expandedId === user.userId ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
          >
            <div className="px-6 sm:px-10 py-6 flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/5 border border-white/10 flex items-center justify-center text-blue-400 font-black text-lg shadow-inner shrink-0">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                    <span className="text-[13px] font-black text-slate-100 truncate tracking-tight">{user.email || 'Unknown User'}</span>
                    <StatusBadge status={user.status} />
                  </div>
                  <div className="flex items-center gap-4 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={10} className="text-blue-500/50" /> {formatBytes(user.totalBytesUsed)}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-800" />
                    <span className="flex items-center gap-1.5"><FolderOpen size={10} className="text-emerald-500/50" /> {user.fileCount || 0} Files</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 w-full lg:w-auto border-t border-white/[0.03] lg:border-0 pt-4 lg:pt-0">
                <div className="flex items-center gap-1">
                    <button onClick={() => onNotify(user)} className="p-2 sm:p-3 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all border border-transparent hover:border-blue-500/20"><Bell size={14} /></button>
                    <button onClick={() => onLimits(user)} className="p-2 sm:p-3 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all border border-transparent hover:border-purple-500/20"><Sliders size={14} /></button>
                </div>
                
                <div className="h-6 w-px bg-white/5 mx-1 hidden lg:block" />

                <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
                  {user.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onAction(user, 'approve')} 
                        className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-500/30 transition-all shadow-lg"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => onAction(user, 'deny')} 
                        className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-500/30 transition-all"
                      >
                        Deny
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onAction(user, user.status === 'suspended' ? 'activate' : 'suspend')}
                      disabled={suspendingId === user.userId}
                      className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] transition-all border shadow-lg ${
                        user.status === 'suspended' 
                          ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/30 shadow-emerald-900/10' 
                          : 'bg-amber-600/20 text-amber-400 border-amber-500/20 hover:bg-amber-500/30 shadow-amber-900/10'
                      }`}
                    >
                      {suspendingId === user.userId ? <Loader2 size={12} className="animate-spin" /> : user.status === 'suspended' ? 'Restore' : 'Suspend User'}
                    </button>
                  )}

                  <button 
                    onClick={() => setExpandedId(expandedId === user.userId ? null : user.userId)}
                    className={`p-2 sm:p-3 rounded-xl transition-all ${expandedId === user.userId ? 'text-blue-400 bg-blue-500/5' : 'text-slate-500 hover:text-white'}`}
                  >
                    {expandedId === user.userId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {expandedId === user.userId && (
              <div className="overflow-hidden bg-white/[0.015] animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="px-6 sm:px-10 pb-8 sm:pb-10 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 sm:p-8 glass-card rounded-2xl sm:rounded-[2rem] border border-white/[0.05] relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-white pointer-events-none">
                      <ShieldCheck size={120} />
                    </div>

                    {[
                      { label: 'User ID', value: user.userId },
                      { label: 'Storage Limit', value: formatBytes(user.storageLimit || 5 * 1024 * 1024 * 1024) },
                      { label: 'Max File Size', value: formatBytes(user.maxFileSize || 1024 * 1024 * 1024) },
                      { label: 'Joined Date', value: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A' }
                    ].map(item => (
                      <div key={item.label} className="relative z-10">
                        <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 sm:mb-2">{item.label}</p>
                        <p className="text-[11px] sm:text-xs font-mono text-slate-200 truncate selection:bg-blue-500/30">{item.value}</p>
                      </div>
                    ))}
                    {user.notes && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-4 p-4 sm:p-5 bg-blue-500/5 rounded-xl sm:rounded-2xl border border-blue-500/10 italic text-[10px] sm:text-[11px] text-blue-200/60 leading-relaxed">
                        <strong className="text-blue-400 uppercase tracking-widest not-italic mr-2">Administrative Notes:</strong> {user.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserRegistry;
