import { 
  Image as ImageIcon, Video, Music, Archive, FileText, File, 
  Eye, Copy, Share2, Trash2, Activity
} from 'lucide-react';
import NSFWBlur from './NSFWBlur';

const FileIcon = ({ type, className }) => {
  if (type?.startsWith('image/')) return <ImageIcon className={className} />;
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
      <div
        className="glass-premium flex flex-col transition-all duration-500 overflow-hidden group border border-white/[0.05] hover:border-blue-500/40 relative shadow-2xl hover:-translate-y-2"
      >
        {/* Thumbnail/Info Area */}
        <button 
          onClick={() => actions.handlePreview(file)} 
          className="flex items-center gap-4 p-5 sm:p-6 text-left w-full active:bg-blue-500/[0.05] transition-colors relative z-10"
        >
          <NSFWBlur moderationStatus={file.moderationStatus}>
            <div className="h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-[1rem] sm:rounded-[1.25rem] bg-slate-950/60 text-blue-400 shrink-0 border border-white/[0.05] group-hover:border-blue-500/40 transition-all shadow-inner">
              <FileIcon type={file.contentType} className="h-6 w-6 sm:h-7 sm:w-7 transition-transform duration-500" />
            </div>
          </NSFWBlur>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] sm:text-[13px] font-black text-white italic truncate tracking-tight mb-1 sm:mb-2 group-hover:text-blue-100 transition-colors" title={file.filename}>
              {file.filename}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/[0.03] px-2 py-0.5 rounded-md">
                {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="text-[8px] sm:text-[9px] font-black font-mono text-blue-500/70 border border-blue-500/10 px-2 py-0.5 rounded-md bg-blue-500/5">
                {formatSize(file.size)}
              </span>
            </div>
          </div>
        </button>

        {/* Action Bar */}
        <div className="flex items-center gap-px bg-slate-950/40 border-t border-white/[0.05] relative z-10">
          {[
            { icon: Eye, label: 'PRVW', action: () => actions.handlePreview(file), color: 'text-blue-400 hover:bg-blue-500/10' },
            { icon: Copy, label: 'CPY', action: () => actions.handleCopyUrl(file.fileId), color: 'text-slate-500 hover:text-white hover:bg-white/5' },
            { icon: Share2, label: 'SHR', action: () => actions.onShare(file), color: 'text-indigo-400 hover:bg-indigo-500/10' },
            { icon: Trash2, label: 'DEL', action: () => actions.handleDelete(file.fileId), color: 'text-rose-400 hover:bg-rose-500/10' }
          ].map(({ icon: Icon, label, action, color }) => (
            <button
              key={label}
              onClick={action}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all group/btn ${color}`}
            >
              <Icon className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-all group-hover/btn:scale-110" />
              <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.2em] opacity-40 group-hover/btn:opacity-100">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-premium mb-3 hover:border-blue-500/40 transition-all duration-500 group relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 sm:py-5"
    >
      <div className="absolute left-0 top-0 h-full w-[3px] bg-blue-600 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 hidden sm:block" />
      
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <NSFWBlur moderationStatus={file.moderationStatus} className="shrink-0">
          <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-slate-950/60 text-blue-400 border border-white/[0.05] group-hover:border-blue-500/30 transition-all">
            <FileIcon type={file.contentType} className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </NSFWBlur>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-0.5 sm:mb-1">
            <p className="text-[13px] sm:text-sm font-black text-white italic truncate group-hover:text-blue-500 transition-colors max-w-[150px] sm:max-w-none" title={file.filename}>
              {file.filename}
            </p>
            <span className="text-[9px] sm:text-[10px] font-black font-mono text-slate-600 uppercase tracking-widest">{formatSize(file.size)}</span>
          </div>
          <div className="flex items-center gap-3">
             <Activity size={10} className="text-blue-500/50" />
             <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
               {new Date(file.uploadedAt).toLocaleDateString()}
             </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end border-t border-white/[0.03] pt-3 sm:pt-0 sm:border-0">
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
            className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all text-slate-600 flex-1 sm:flex-none flex items-center justify-center ${color}`}
          >
            <Icon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default FileItem;
