import { Users, ShieldCheck, UserX, UserCheck, Bell, Sliders, ChevronDown, ChevronUp, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react';
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
    suspended: { icon: XCircle, text: 'Suspended', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    pending: { icon: Clock, text: 'Pending', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    denied: { icon: XCircle, text: 'Denied', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    active: { icon: CheckCircle2, text: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
  };
  const config = configs[status] || configs.active;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${config.color}`}>
      <Icon size={10} /> {config.text}
    </span>
  );
};

const UserRegistry = ({ users, loading, suspendingId, onAction, onNotify, onLimits }) => {
  const [expandedId, setExpandedId] = useState(null);

  if (loading && users.length === 0) {
    return (
      <div className="py-24 flex flex-col items-center gap-4 glass rounded-[2rem] border border-white/[0.05]">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Synchronizing Registry...</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-[2rem] border border-white/[0.05] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-8 py-6 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Users size={16} className="text-blue-400" /> Identity Matrix
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            {users.length} Verified Entities
          </p>
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {users.map((user, i) => (
          <motion.div 
            key={user.userId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="group"
          >
            <div className="px-8 py-5 flex items-center gap-4 hover:bg-white/[0.01] transition-colors">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-white/5 flex items-center justify-center text-blue-400 font-black text-sm">
                {user.email?.[0].toUpperCase() || 'U'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-200 truncate">{user.email || 'Anonymous Entity'}</span>
                  <StatusBadge status={user.status} />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>{formatBytes(user.totalBytesUsed)} Consumed</span>
                  <span className="h-1 w-1 rounded-full bg-slate-700" />
                  <span>{user.fileCount || 0} Objects</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => onNotify(user)} className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"><Bell size={14} /></button>
                <button onClick={() => onLimits(user)} className="p-2.5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all"><Sliders size={14} /></button>
                
                {user.status === 'pending' ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onAction(user, 'approve')} 
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => onAction(user, 'deny')} 
                      className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                    >
                      Deny
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => onAction(user, user.status === 'suspended' ? 'activate' : 'suspend')}
                    disabled={suspendingId === user.userId}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      user.status === 'suspended' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                    }`}
                  >
                    {suspendingId === user.userId ? <Loader2 size={12} className="animate-spin" /> : user.status === 'suspended' ? 'Activate' : 'Suspend'}
                  </button>
                )}

                <button 
                  onClick={() => setExpandedId(expandedId === user.userId ? null : user.userId)}
                  className="p-2.5 text-slate-500 hover:text-white transition-all"
                >
                  {expandedId === user.userId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedId === user.userId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-white/[0.01]"
                >
                  <div className="px-8 pb-8 pt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 glass-card rounded-2xl border border-white/[0.03]">
                      {[
                        { label: 'Identifier', value: user.userId },
                        { label: 'Storage Quota', value: formatBytes(user.storageLimit || 5 * 1024 * 1024 * 1024) },
                        { label: 'Max File Size', value: formatBytes(user.maxFileSize || 1024 * 1024 * 1024) },
                        { label: 'Created At', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' }
                      ].map(item => (
                        <div key={item.label}>
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.label}</p>
                          <p className="text-xs font-mono text-slate-300 truncate">{item.value}</p>
                        </div>
                      ))}
                      {user.notes && (
                        <div className="col-span-2 md:col-span-4 mt-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 italic text-[11px] text-amber-200/70">
                          <strong>Admin Memo:</strong> {user.notes}
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
