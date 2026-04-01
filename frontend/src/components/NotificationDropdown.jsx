import { Bell, X, Check, Info, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const NotificationDropdown = ({ notifications, onMarkRead, onClose }) => {
  const unread = notifications.filter(n => !n.read);

  return (
    <div 
      className="absolute right-0 top-full mt-4 w-[320px] sm:w-[400px] bg-slate-950/95 backdrop-blur-3xl rounded-[2rem] border border-white/[0.1] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[200]"
      onClick={e => e.stopPropagation()}
    >
      <div className="px-6 py-5 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
            <Bell size={16} />
          </div>
          <div>
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Notifications</h3>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{unread.length} Unread Messages</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto no-scrollbar divide-y divide-white/[0.03]">
        {notifications.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-4 opacity-40">
            <Bell size={32} className="text-slate-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic">No messages found</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.notificationId} 
              className={`p-6 transition-all relative group ${!n.read ? 'bg-blue-500/[0.03]' : 'opacity-60'}`}
            >
              <div className="flex gap-4">
                <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border transition-all ${
                  n.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                  'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {n.type === 'warning' ? <AlertTriangle size={18} /> :
                   n.type === 'success' ? <CheckCircle2 size={18} /> :
                   <Info size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate italic">{n.subject}</h4>
                    {!n.read && (
                      <button 
                        onClick={() => onMarkRead(n.notificationId)}
                        className="h-5 w-5 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all scale-0 group-hover:scale-100"
                        title="Mark as read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-3 line-clamp-3 italic">
                    {n.message}
                  </p>
                  <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    <Clock size={10} />
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-4 bg-white/[0.01] border-t border-white/[0.05]">
          <button 
            onClick={() => notifications.forEach(n => !n.read && onMarkRead(n.notificationId))}
            className="w-full py-3 rounded-xl hover:bg-white/5 text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-[0.3em] transition-all"
          >
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
