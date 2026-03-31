import { motion } from 'framer-motion';
import { 
  Image, Video, Music, Archive, FileText, File, 
  Eye, Copy, Share2, Trash2, Activity
} from 'lucide-react';
import NSFWBlur from './NSFWBlur';

const FileIcon = ({ type, className }) => {
  if (type?.startsWith('image/')) return <Image className={className} />;
  if (type?.startsWith('video/')) return <Video className={className} />;
  if (type?.startsWith('audio/')) return <Music className={className} />;
  if (type === 'application/pdf' || type?.startsWith('text/')) return <FileText className={className} />;
  if (type?.includes('zip') || type?.includes('rar') || type?.includes('tar')) return <Archive className={className} />;
  return <File className={className} />;
};

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const FileItem = ({ file, viewMode, actions }) => {
  const isGrid = viewMode === 'grid';
  
  if (isGrid) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ 
          y: -8, 
          scale: 1.02,
          transition: { type: "spring", stiffness: 400, damping: 25 } 
        }}
        className="glass-premium flex flex-col transition-all duration-500 overflow-hidden group border border-white/[0.05] hover:border-blue-500/40 relative shadow-2xl"
      >
        {/* Animated Scan Line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent translate-y-[-100%] group-hover:animate-scan z-20 pointer-events-none" />
        
        {/* Thumbnail/Info Area */}
        <button 
          onClick={() => actions.handlePreview(file)} 
          className="flex items-center gap-4 p-6 text-left w-full active:bg-blue-500/[0.05] transition-colors relative z-10"
        >
          <NSFWBlur moderationStatus={file.moderationStatus}>
            <div className="h-14 w-14 flex items-center justify-center rounded-[1.25rem] bg-slate-950/60 text-blue-400 shrink-0 border border-white/[0.05] group-hover:border-blue-500/40 transition-all shadow-inner group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <FileIcon type={file.contentType} className="h-7 w-7 group-hover:scale-110 transition-transform duration-500" />
            </div>
          </NSFWBlur>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black text-white italic truncate tracking-tight mb-2 group-hover:text-blue-100 transition-colors" title={file.filename}>
              {file.filename}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/[0.03] px-2 py-0.5 rounded-md">
                {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-[9px] font-black font-mono text-blue-500/70 border border-blue-500/10 px-2 py-0.5 rounded-md bg-blue-500/5">
                {formatSize(file.size)}
              </span>
            </div>
          </div>
        </button>

        {/* Action Bar */}
        <div className="flex items-center gap-1 p-2 bg-slate-950/40 border-t border-white/[0.05] relative z-10">
          {[
            { icon: Eye, label: 'PRVW', action: () => actions.handlePreview(file), color: 'text-blue-400 hover:bg-blue-500/10' },
            { icon: Copy, label: 'CPY', action: () => actions.handleCopyUrl(file.fileId), color: 'text-slate-500 hover:text-white hover:bg-white/5' },
            { icon: Share2, label: 'SHR', action: () => actions.onShare(file), color: 'text-indigo-400 hover:bg-indigo-500/10' },
            { icon: Trash2, label: 'DEL', action: () => actions.handleDelete(file.fileId), color: 'text-rose-400 hover:bg-rose-500/10' }
          ].map(({ icon: Icon, label, action, color }) => (
            <button
              key={label}
              onClick={action}
              className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all group/btn ${color}`}
            >
              <Icon className="h-3.5 w-3.5 transition-all group-hover/btn:scale-125" />
              <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-40 group-hover/btn:opacity-100">
                {label}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ x: 8 }}
      className="glass-premium mb-3 hover:border-blue-500/40 transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 h-full w-[3px] bg-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
      
      <div className="flex items-center gap-6 px-6 py-5 relative z-10">
        <NSFWBlur moderationStatus={file.moderationStatus} className="shrink-0">
          <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-950/60 text-blue-400 border border-white/[0.05] group-hover:border-blue-500/30 transition-all">
            <FileIcon type={file.contentType} className="h-6 w-6" />
          </div>
        </NSFWBlur>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4 mb-1">
            <p className="text-sm font-black text-white italic truncate group-hover:text-blue-500 transition-colors" title={file.filename}>
              {file.filename}
            </p>
            <span className="text-[10px] font-black font-mono text-slate-600 uppercase tracking-widest">{formatSize(file.size)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
               <Activity size={10} className="text-blue-500/50" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                 Verfied: {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
               </span>
            </div>
            {(file.tags || []).slice(0, 3).map((tag) => (
              <span key={tag} className="hidden sm:inline text-[8px] px-2 py-0.5 rounded-md bg-blue-500/5 text-blue-500/60 border border-blue-500/10 font-bold uppercase tracking-widest">{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {[
            { icon: Eye, label: 'View', action: () => actions.handlePreview(file), color: 'hover:text-blue-400 hover:bg-blue-500/10' },
            { icon: Copy, label: 'Copy', action: () => actions.handleCopyUrl(file.fileId), color: 'hover:text-white hover:bg-white/10' },
            { icon: Share2, label: 'Share', action: () => actions.onShare(file), color: 'hover:text-indigo-400 hover:bg-indigo-500/10' },
            { icon: Trash2, label: 'Delete', action: () => actions.handleDelete(file.fileId), color: 'hover:text-rose-400 hover:bg-rose-500/10' }
          ].map(({ icon: Icon, label, action, color }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className={`p-3 rounded-2xl transition-all text-slate-600 ${color}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default FileItem;
