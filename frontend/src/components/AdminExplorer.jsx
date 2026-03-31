import { FolderOpen, Eye, Trash2, Search, AlertTriangle, Loader2, Database, Layers, RefreshCw } from 'lucide-react';
import { useState } from 'react';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ExtIcon = ({ filename }) => {
  const ext = filename?.split('.').pop()?.toUpperCase() || '?';
  const configs = {
    JPG: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
    PNG: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
    MP4: 'bg-rose-500/20 text-rose-300 border-rose-500/20',
    PDF: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
    ZIP: 'bg-slate-500/20 text-slate-300 border-slate-500/20'
  };
  const config = configs[ext] || 'bg-slate-800 text-slate-400 border-white/5';
  
  return (
    <div className={`h-10 w-12 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 border shadow-inner ${config}`}>
      {ext}
    </div>
  );
};

const AdminExplorer = ({ files, loading, deletingId, onPreview, onDelete, onNext, hasNext }) => {
  const [search, setSearch] = useState('');

  const filtered = files.filter(f => 
    (f.filename || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.userId || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="glass-premium rounded-[2rem] sm:rounded-[3rem] border border-white/[0.05] overflow-hidden">
      <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-white/[0.05] bg-white/[0.01] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-[13px] sm:text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <FolderOpen size={16} className="text-blue-400" /> Global File Storage
          </h2>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            All System Files ({filtered.length} Indexed)
          </p>
        </div>
        
        <div className="relative group w-full lg:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" size={14} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Files..."
            className="bg-slate-950/60 border border-white/[0.05] focus:border-blue-500/40 rounded-xl sm:rounded-2xl pl-12 pr-4 py-3 text-[11px] text-slate-100 placeholder-slate-600 w-full transition-all uppercase tracking-[0.15em] font-black shadow-inner relative z-10"
          />
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {filtered.length === 0 ? (
          <div className="py-24 sm:py-32 text-center flex flex-col items-center gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 bg-slate-900 rounded-2xl sm:rounded-3xl flex items-center justify-center text-slate-700 border border-white/5 mb-2">
                <Database size={24} />
            </div>
            <p className="text-[10px] sm:text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">No Files Found</p>
          </div>
        ) : (
          filtered.map((file) => (
            <div 
              key={file.fileId}
              className="px-6 sm:px-10 py-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 hover:bg-white/[0.01] transition-all group relative overflow-hidden"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <ExtIcon filename={file.filename} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] sm:text-sm font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{file.filename}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">
                    <span className="flex items-center gap-1.5"><Layers size={10} className="text-blue-500/50" /> {file.email || file.userId.slice(0, 12)}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-800 hidden xs:inline" />
                    <span>{formatBytes(file.size)}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-800 hidden xs:inline" />
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    {file.isNsfw && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle size={10} /> Flagged
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 justify-end sm:justify-start border-t border-white/[0.03] pt-4 sm:pt-0 sm:border-0">
                <button 
                  onClick={() => onPreview(file)}
                  className="p-2.5 sm:p-3.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl sm:rounded-2xl transition-all border border-transparent hover:border-blue-500/20 flex-1 sm:flex-none flex items-center justify-center"
                >
                  <Eye size={18} />
                </button>
                <button 
                  onClick={() => onDelete(file.userId, file.fileId)}
                  disabled={deletingId === file.fileId}
                  className="p-2.5 sm:p-3.5 text-slate-400 sm:text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl sm:rounded-2xl transition-all border border-transparent hover:border-rose-500/20 flex-1 sm:flex-none flex items-center justify-center"
                >
                  {deletingId === file.fileId ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {hasNext && (
        <div className="px-6 sm:px-10 py-6 sm:py-8 border-t border-white/[0.05] flex justify-center bg-white/[0.01]">
          <button 
            onClick={onNext}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 rounded-xl sm:rounded-[1.5rem] bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-slate-300 transition-all flex items-center justify-center gap-3 shadow-lg hover:-translate-y-1 active:scale-[0.98]"
          >
            {loading ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <RefreshCw size={14} className="text-blue-500" />}
            Load More Files
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminExplorer;
