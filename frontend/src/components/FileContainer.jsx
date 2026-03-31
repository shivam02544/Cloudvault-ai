import { Loader2, Search, Upload } from 'lucide-react';
import FileItem from './FileItem';

const FileContainer = ({ files, viewMode, loading, loadError, searchTerm, actions }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 sm:py-32 gap-6 bg-white/[0.01] rounded-[2rem] border border-white/[0.03]">
        <div className="relative h-12 w-12 sm:h-14 sm:w-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
        </div>
        <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] animate-pulse text-center">
          Loading Vault Files...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-16 sm:py-20 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500"
      >
        <div className="h-12 w-12 sm:h-14 sm:w-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
          <Loader2 className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <p className="text-rose-400 font-black text-[12px] sm:text-sm uppercase tracking-widest">Connection Error</p>
        <p className="text-slate-500 text-[10px] sm:text-xs mt-2 max-w-[240px] sm:max-w-[280px] text-center leading-relaxed font-bold uppercase tracking-tight">
          We encountered an issue connecting to your vault. Please verify your connection.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-8 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl border border-rose-500/20 transition-all hover:-translate-y-1 active:scale-[0.98]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-20 sm:py-24 rounded-[2rem] border-2 border-dashed border-white/[0.05] bg-white/[0.01] animate-in fade-in duration-700"
      >
        <div className="h-14 w-14 sm:h-16 sm:w-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-600 mb-6 border border-white/[0.05] shadow-inner">
          {searchTerm ? <Search className="h-6 w-6 sm:h-7 sm:w-7" /> : <Upload className="h-6 w-6 sm:h-7 sm:w-7" />}
        </div>
        <p className="text-slate-200 font-black text-base sm:text-lg uppercase tracking-tight italic">Vault is Empty</p>
        <p className="text-slate-500 text-[10px] sm:text-sm mt-2 max-w-[220px] sm:max-w-[260px] text-center leading-relaxed font-bold uppercase tracking-[0.05em] opacity-80">
          {searchTerm 
            ? `No files matching "${searchTerm}" found in your vault.` 
            : 'Start by uploading your first file to see it here in the vault.'}
        </p>
        {searchTerm && (
          <button 
            onClick={() => actions.resetSearch()}
            className="mt-6 text-blue-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:translate-x-1"
          >
            Clear Filter
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" 
      : "flex flex-col gap-3"
    }>
      {files.map(file => (
        <FileItem 
          key={file.fileId} 
          file={file} 
          viewMode={viewMode} 
          actions={actions} 
        />
      ))}
    </div>
  );
};

export default FileContainer;
