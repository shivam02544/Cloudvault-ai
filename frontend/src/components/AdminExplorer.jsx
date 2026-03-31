import { FolderOpen, Eye, Trash2, Search, ExternalLink, Download, FileQuestion, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ExtIcon = ({ filename }) => {
  const ext = filename?.split('.').pop()?.toUpperCase() || '?';
  const colors = {
    JPG: 'bg-violet-500/20 text-violet-300', PNG: 'bg-blue-500/20 text-blue-300',
    MP4: 'bg-rose-500/20 text-rose-300', PDF: 'bg-amber-500/20 text-amber-300',
    ZIP: 'bg-slate-500/20 text-slate-300'
  };
  return (
    <div className={`h-8 w-10 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 border border-white/5 ${colors[ext] || 'bg-slate-700/60 text-slate-400'}`}>
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
    <div className="glass rounded-[2rem] border border-white/[0.05] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-8 py-6 border-b border-white/[0.05] bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <FolderOpen size={16} className="text-blue-400" /> Platform Storage
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
            Global Object Index
          </p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={14} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Global Assets..."
            className="bg-slate-950/40 border border-white/[0.05] focus:border-blue-500/30 rounded-2xl pl-10 pr-4 py-2 text-[10px] text-slate-100 placeholder-slate-600 w-full sm:w-64 transition-all uppercase tracking-widest font-black"
          />
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">Zero Results in Search Index</p>
          </div>
        ) : (
          filtered.map((file, i) => (
            <motion.div 
              key={file.fileId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="px-8 py-5 flex items-center gap-4 hover:bg-white/[0.01] transition-colors group"
            >
              <ExtIcon filename={file.filename} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">{file.filename}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest flex-wrap">
                  <span className="text-slate-400">{file.email || file.userId.slice(0, 16)}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-slate-700" />
                  <span>{formatBytes(file.size)}</span>
                  <span className="h-0.5 w-0.5 rounded-full bg-slate-700" />
                  <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  {file.isNsfw && (
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/10 flex items-center gap-1">
                      <AlertTriangle size={8} /> SENSITIVE
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => onPreview(file)}
                  className="p-2.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={() => onDelete(file.userId, file.fileId)}
                  disabled={deletingId === file.fileId}
                  className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  {deletingId === file.fileId ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {hasNext && (
        <div className="px-8 py-6 border-t border-white/[0.05] flex justify-center bg-white/[0.01]">
          <button 
            onClick={onNext}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-all flex items-center gap-2"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            Sync Forward Index
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminExplorer;
