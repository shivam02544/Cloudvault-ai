import { ShieldCheck, Eye, Trash2, CheckCircle2, AlertTriangle, Loader2, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';

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
    <div className="glass-premium rounded-[2rem] border border-white/[0.05] overflow-hidden min-h-[400px]">
      <div className="px-6 sm:px-8 py-6 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
        <div>
          <h2 className="text-[13px] sm:text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <ShieldCheck size={16} className="text-rose-400" /> Content Safety Center
          </h2>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            {files.length} Flagged Files
          </p>
        </div>
        <button onClick={onRefresh} className="p-2.5 text-slate-500 hover:text-white bg-white/[0.03] border border-white/5 rounded-xl transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {selectedMod.size > 0 && (
        <div className="px-6 sm:px-8 py-4 bg-amber-500/5 border-b border-amber-500/10 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
            {selectedMod.size} Selected Files
          </span>
          <button 
            onClick={() => setSelectedMod(new Set())}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="divide-y divide-white/[0.03]">
        {loading && files.length === 0 ? (
          <div className="py-24 sm:py-32 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-rose-500" size={32} />
            <p className="text-[10px] sm:text-sm font-black text-slate-600 uppercase tracking-widest">Loading Safety Data...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="py-24 sm:py-32 flex flex-col items-center gap-4 text-center px-6">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500/30 border border-emerald-500/20 mb-2">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-[10px] sm:text-sm font-black text-slate-600 uppercase tracking-widest">No Safety Alerts</p>
          </div>
        ) : (
          <>
            <div className="px-6 sm:px-8 py-3 flex items-center gap-3 bg-white/[0.01]">
              <input 
                type="checkbox"
                checked={selectedMod.size === files.length && files.length > 0}
                onChange={e => handleSelectAll(e.target.checked)}
                className="rounded border-white/20 bg-slate-900/40 text-blue-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
              />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none">Select All</span>
            </div>

            {files.map((file) => (
              <div 
                key={file.fileId}
                className={`px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:bg-white/[0.01] transition-colors relative ${selectedMod.has(file.fileId) ? 'bg-amber-500/5' : ''}`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                  <input 
                    type="checkbox"
                    checked={selectedMod.has(file.fileId)}
                    onChange={() => handleToggleSelect(file.fileId)}
                    className="mt-1.5 rounded border-white/10 bg-slate-950/40 text-amber-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] sm:text-sm font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{file.filename}</p>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">User ID: {file.userId.slice(0, 16)}...</p>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(file.moderationLabels || []).map((label, li) => (
                        <span key={li} className="px-2.5 py-1 rounded-lg bg-rose-600/10 text-rose-400 border border-rose-500/10 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <AlertTriangle size={10} /> {label.name} <span className="opacity-50 font-mono ml-1">{Math.round(label.confidence)}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-white/[0.03] sm:border-0 justify-end">
                  <button 
                    onClick={() => onPreview(file)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800/40 text-slate-400 hover:text-white border border-white/5 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button 
                    onClick={() => onMarkSafe(file.userId, file.fileId)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={12} /> Mark Safe
                  </button>
                  <button 
                    onClick={() => onDelete(file.userId, file.fileId)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminModeration;
