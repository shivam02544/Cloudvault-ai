import { FolderOpen, Eye, Trash2, Search, ExternalLink, Download, FileQuestion, AlertTriangle, Loader2, Database, Layers, RefreshCw } from 'lucide-react';
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
  const configs = {
    JPG: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
    PNG: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
    MP4: 'bg-rose-500/20 text-rose-300 border-rose-500/20',
    PDF: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
    ZIP: 'bg-slate-500/20 text-slate-300 border-slate-500/20'
  };
  const config = configs[ext] || 'bg-slate-800 text-slate-400 border-white/5';
  
  return (
    <div className={`h-10 w-12 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 border shadow-inner group-hover:scale-110 transition-transform duration-500 ${config}`}>
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
    <div className="glass-premium rounded-[3rem] border border-white/[0.05] overflow-hidden">
      <div className="px-10 py-8 border-b border-white/[0.05] bg-white/[0.01] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <FolderOpen size={16} className="text-blue-400" /> Platform Storage
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-2 opacity-60">
            Global Object Index ({filtered.length} Indexed)
          </p>
        </div>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/5 blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors z-10" size={14} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Global Assets..."
            className="bg-slate-950/60 border border-white/[0.05] focus:border-blue-500/40 rounded-2xl pl-12 pr-4 py-3 text-[11px] text-slate-100 placeholder-slate-600 w-full sm:w-72 transition-all uppercase tracking-[0.15em] font-black shadow-inner relative z-10"
          />
          {search && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse z-10" />
          )}
        </div>
      </div>

      <div className="divide-y divide-white/[0.03]">
        {filtered.length === 0 ? (
          <div className="py-32 text-center flex flex-col items-center gap-4">
            <div className="h-16 w-16 bg-slate-900 rounded-3xl flex items-center justify-center text-slate-700 border border-white/5 mb-2">
                <Database size={24} />
            </div>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.3em]">Zero Results in Search Index</p>
          </div>
        ) : (
          filtered.map((file, i) => (
            <motion.div 
              key={file.fileId}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="px-10 py-6 flex items-center gap-6 hover:bg-white/[0.01] transition-all group"
            >
              <ExtIcon filename={file.filename} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors uppercase tracking-tight">{file.filename}</p>
                <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60 flex-wrap">
                  <span className="flex items-center gap-1.5"><Layers size={10} className="text-blue-500/50" /> {file.email || file.userId.slice(0, 12)}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-800" />
                  <span>{formatBytes(file.size)}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-800" />
                  <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  {file.isNsfw && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle size={10} /> SENSITIVE
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onPreview(file)}
                  className="p-3.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-2xl transition-all border border-transparent hover:border-blue-500/20"
                >
                  <Eye size={18} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(file.userId, file.fileId)}
                  disabled={deletingId === file.fileId}
                  className="p-3.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
                >
                  {deletingId === file.fileId ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                </motion.button>
              </div>

              {/* Hover Scan Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-scan" style={{ animationDuration: '3s' }} />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {hasNext && (
        <div className="px-10 py-8 border-t border-white/[0.05] flex justify-center bg-white/[0.01]">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNext}
            disabled={loading}
            className="px-8 py-4 rounded-[1.5rem] bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-[11px] font-black uppercase tracking-[0.25em] text-slate-300 transition-all flex items-center gap-3 shadow-lg"
          >
            {loading ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <RefreshCw size={14} className="text-blue-500" />}
            Sync Forward Index
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default AdminExplorer;
