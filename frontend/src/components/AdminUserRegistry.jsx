import { Users, ShieldCheck, UserX, UserCheck, Bell, Sliders, ChevronDown, ChevronUp, Loader2, Clock, CheckCircle2, XCircle, Activity, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StatusBadge = ({ status }) => {
  const configs = {
    suspended: { icon: XCircle, text: 'Suspended', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20 glow-rose' },
    pending: { icon: Clock, text: 'Pending Approval', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20 glow-amber' },
    denied: { icon: XCircle, text: 'Denied', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    active: { icon: CheckCircle2, text: 'Active Entity', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 glow-emerald' }
  };
  const config = configs[status] || configs.active;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-500 ${config.color}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color.split(' ')[1].replace('text-', 'bg-')}`}></span>
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.color.split(' ')[1].replace('text-', 'bg-')}`}></span>
      </span>
      {config.text}
    </span>
  );
};

const UserRegistry = ({ users, loading, suspendingId, onAction, onNotify, onLimits }) => {
  const [expandedId, setExpandedId] = useState(null);

  if (loading && users.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-6 glass-premium rounded-[3rem] border border-white/[0.05]">
        <div className="p-4 bg-blue-500/10 rounded-2xl animate-pulse">
            <Loader2 className="animate-spin text-blue-400" size={32} />
        </div>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Synchronizing Identity Matrix...</p>
      </div>
    );
  }

  return (
    <div className="glass-premium rounded-[3rem] border border-white/[0.05] overflow-hidden">
      <div className="px-10 py-8 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Users size={16} className="text-blue-400" /> Identity Matrix
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            {users.length} Active System Entities
          </p>
        </div>
        <div className="h-10 w-10 bg-slate-900/50 rounded-xl flex items-center justify-center text-slate-500 border border-white/5">
            <Activity size={16} />
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {users.map((user, i) => (
          <motion.div 
            key={user.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.5 }}
            className={`group transition-all ${expandedId === user.userId ? 'bg-white/[0.02]' : 'hover:bg-white/[0.01]'}`}
          >
            <div className="px-10 py-6 flex items-center gap-6">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-indigo-600/5 border border-white/10 flex items-center justify-center text-blue-400 font-black text-lg shadow-inner group-hover:scale-110 transition-transform duration-500">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <span className="text-[13px] font-black text-slate-100 truncate tracking-tight">{user.email || 'Anonymous Entity'}</span>
                  <StatusBadge status={user.status} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">
                  <span className="flex items-center gap-1.5"><ShieldCheck size={10} className="text-blue-500/50" /> {formatBytes(user.totalBytesUsed)}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-800" />
                  <span className="flex items-center gap-1.5"><FolderOpen size={10} className="text-emerald-500/50" /> {user.fileCount || 0} Objects</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onNotify(user)} className="p-3 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-2xl transition-all border border-transparent hover:border-blue-500/20"><Bell size={14} /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onLimits(user)} className="p-3 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-2xl transition-all border border-transparent hover:border-purple-500/20"><Sliders size={14} /></motion.button>
                </div>
                
                <div className="h-6 w-px bg-white/5 mx-1 hidden sm:block" />

                {user.status === 'pending' ? (
                  <div className="flex items-center gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onAction(user, 'approve')} 
                      className="px-5 py-2.5 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-emerald-500/30 transition-all shadow-lg shadow-emerald-900/10"
                    >
                      Approve
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onAction(user, 'deny')} 
                      className="px-5 py-2.5 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-rose-500/30 transition-all"
                    >
                      Deny
                    </motion.button>
                  </div>
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onAction(user, user.status === 'suspended' ? 'activate' : 'suspend')}
                    disabled={suspendingId === user.userId}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border shadow-lg ${
                      user.status === 'suspended' 
                        ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/30 shadow-emerald-900/10' 
                        : 'bg-amber-600/20 text-amber-400 border-amber-500/20 hover:bg-amber-500/30 shadow-amber-900/10'
                    }`}
                  >
                    {suspendingId === user.userId ? <Loader2 size={12} className="animate-spin" /> : user.status === 'suspended' ? 'Restore Access' : 'Suspend Entity'}
                  </motion.button>
                )}

                <motion.button 
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                  onClick={() => setExpandedId(expandedId === user.userId ? null : user.userId)}
                  className={`p-3 rounded-2xl transition-all ${expandedId === user.userId ? 'text-blue-400 bg-blue-500/5' : 'text-slate-500 hover:text-white'}`}
                >
                  {expandedId === user.userId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {expandedId === user.userId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden bg-white/[0.015]"
                >
                  <div className="px-10 pb-10 pt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 glass-card rounded-[2rem] border border-white/[0.05] relative overflow-hidden backdrop-blur-xl">
                      <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-white pointer-events-none">
                        <ShieldCheck size={120} />
                      </div>

                      {[
                        { label: 'System Identifier', value: user.userId },
                        { label: 'Storage Threshold', value: formatBytes(user.storageLimit || 5 * 1024 * 1024 * 1024) },
                        { label: 'Packet Limit', value: formatBytes(user.maxFileSize || 1024 * 1024 * 1024) },
                        { label: 'Intelligence Logged', value: user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A' }
                      ].map(item => (
                        <div key={item.label} className="relative z-10">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{item.label}</p>
                          <p className="text-xs font-mono text-slate-200 truncate selection:bg-blue-500/30">{item.value}</p>
                        </div>
                      ))}
                      {user.notes && (
                        <div className="col-span-2 md:col-span-4 mt-4 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10 italic text-[11px] text-blue-200/60 leading-relaxed">
                          <strong className="text-blue-400 uppercase tracking-widest not-italic mr-2">Admin Log:</strong> {user.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UserRegistry;
