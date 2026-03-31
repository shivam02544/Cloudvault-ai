import { motion } from 'framer-motion';
import { 
  Image, Video, Music, Archive, FileText, File, 
  Eye, Copy, Share2, Trash2 
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
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="glass-card flex flex-col transition-all duration-300 hover:glow-blue overflow-hidden group border border-white/[0.05] hover:border-blue-500/30"
      >
        {/* Thumbnail/Info Area */}
        <button 
          onClick={() => actions.handlePreview(file)} 
          className="flex items-center gap-4 p-5 text-left w-full active:bg-white/[0.04] transition-colors"
        >
          <NSFWBlur moderationStatus={file.moderationStatus}>
            <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 text-blue-400 shrink-0 border border-blue-500/20 group-hover:border-blue-400/40 transition-colors">
              <FileIcon type={file.contentType} className="h-6 w-6" />
            </div>
          </NSFWBlur>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100 truncate leading-snug group-hover:text-white transition-colors" title={file.filename}>
              {file.filename}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-[10px] text-slate-700">·</span>
              <span className="text-[10px] font-mono text-slate-500">{formatSize(file.size)}</span>
              {(file.tags || []).slice(0, 1).map((tag, i) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-widest">{tag}</span>
              ))}
            </div>
          </div>
        </button>

        {/* Action Bar */}
        <div className="flex items-center gap-1 p-2 bg-white/[0.02] border-t border-white/[0.04]">
          {[
            { icon: Eye, label: 'View', action: () => actions.handlePreview(file), color: 'text-blue-400 hover:bg-blue-500/10' },
            { icon: Copy, label: 'Copy', action: () => actions.handleCopyUrl(file.fileId), color: 'text-slate-400 hover:bg-white/10' },
            { icon: Share2, label: 'Share', action: () => actions.onShare(file), color: 'text-indigo-400 hover:bg-indigo-500/10' },
            { icon: Trash2, label: 'Del', action: () => actions.handleDelete(file.fileId), color: 'text-rose-400 hover:bg-rose-500/10' }
          ].map(({ icon: Icon, label, action, color }) => (
            <button
              key={label}
              onClick={action}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl transition-all group/btn ${color}`}
            >
              <Icon className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" />
              <span className="text-[8px] font-black uppercase tracking-[0.1em] opacity-60 group-hover/btn:opacity-100">{label}</span>
            </button>
          ))}
        </div>

      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="glass-card mb-2 hover:glow-blue hover:border-blue-500/30 transition-all duration-300 group"
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <NSFWBlur moderationStatus={file.moderationStatus} className="shrink-0">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:border-blue-400/40 transition-colors">
            <FileIcon type={file.contentType} className="h-5 w-5" />
          </div>
        </NSFWBlur>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-white transition-colors" title={file.filename}>
              {file.filename}
            </p>
            <span className="text-[10px] font-mono text-slate-600 hidden sm:inline">{formatSize(file.size)}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
              {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-700">·</span>
            {(file.tags || []).slice(0, 3).map((tag) => (
              <span key={tag} className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-widest">{tag}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {[
            { icon: Eye, label: 'View', action: () => actions.handlePreview(file), color: 'hover:text-blue-400 hover:bg-blue-500/10' },
            { icon: Copy, label: 'Copy', action: () => actions.handleCopyUrl(file.fileId), color: 'hover:text-slate-200 hover:bg-white/5' },
            { icon: Share2, label: 'Share', action: () => actions.onShare(file), color: 'hover:text-indigo-400 hover:bg-indigo-500/10' },
            { icon: Trash2, label: 'Delete', action: () => actions.handleDelete(file.fileId), color: 'hover:text-rose-400 hover:bg-rose-500/10' }
          ].map(({ icon: Icon, label, action, color }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className={`p-2.5 rounded-xl transition-all text-slate-500 ${color}`}
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
