import { ShieldCheck, Eye, Trash2, CheckCircle2, AlertTriangle, Loader2, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const AdminModeration = ({ files, loading, selectedMod, setSelectedMod, onPreview, onMarkSafe, onDelete, onRefresh }) => {
  
  const handleToggleSelect = (fileId) => {
    const next = new Set(selectedMod);
    if (next.has(fileId)) next.delete(fileId);
    else next.add(fileId);
    setSelectedMod(next);
  };

  const handleSelectAll = (checked) => {
    if (checked) setSelectedMod(new Set(files.map(f => f.fileId)));
    else setSelectedMod(new Set());
  };

  return (
    <div className="glass rounded-[2rem] border border-white/[0.05] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
      <div className="px-8 py-6 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck size={16} className="text-rose-400" /> AI Moderation Matrix
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            {files.length} Flagged Objects
          </p>
        </div>
        <button onClick={onRefresh} className="p-2.5 text-slate-500 hover:text-white bg-white/[0.03] border border-white/5 rounded-xl transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <AnimatePresence>
        {selectedMod.size > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-8 py-4 bg-amber-500/5 border-b border-amber-500/10 flex items-center justify-between"
          >
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
              {selectedMod.size} Targeted Entities
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedMod(new Set())}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-white/[0.03]">
        {loading && files.length === 0 ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-rose-500" size={32} />
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Synchronizing Safety Index...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <CheckCircle2 size={48} className="text-emerald-500/30" />
            <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Platform Integrity Verified</p>
          </div>
        ) : (
          <>
            <div className="px-8 py-3 flex items-center gap-3 bg-white/[0.01]">
              <input 
                type="checkbox"
                checked={selectedMod.size === files.length && files.length > 0}
                onChange={e => handleSelectAll(e.target.checked)}
                className="rounded border-white/20 bg-slate-900/40 text-blue-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
              />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Global Selection</span>
            </div>

            {files.map((file, i) => (
              <motion.div 
                key={file.fileId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`px-8 py-5 flex items-start gap-4 hover:bg-white/[0.01] transition-colors ${selectedMod.has(file.fileId) ? 'bg-amber-500/[0.02]' : ''}`}
              >
                <input 
                  type="checkbox"
                  checked={selectedMod.has(file.fileId)}
                  onChange={() => handleToggleSelect(file.fileId)}
                  className="mt-1.5 rounded border-white/10 bg-slate-950/40 text-amber-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate">{file.filename}</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Entity: {file.userId.slice(0, 16)}...</p>
                  
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(file.moderationLabels || []).map((label, li) => (
                      <span key={li} className="px-2 py-0.5 rounded-lg bg-rose-600/10 text-rose-400 border border-rose-500/10 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle size={8} /> {label.name} <span className="opacity-50 font-mono">{Math.round(label.confidence)}%</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button 
                    onClick={() => onPreview(file)}
                    className="px-4 py-2 rounded-xl bg-slate-800/40 text-slate-400 hover:text-white border border-white/5 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <Eye size={12} /> Inspect
                  </button>
                  <button 
                    onClick={() => onMarkSafe(file.userId, file.fileId)}
                    className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <CheckCircle2 size={12} /> Mark Safe
                  </button>
                  <button 
                    onClick={() => onDelete(file.userId, file.fileId)}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <Trash2 size={12} /> Terminate
                  </button>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminModeration;
