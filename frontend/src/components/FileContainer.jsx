import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Search, Upload } from 'lucide-react';
import FileItem from './FileItem';

const FileContainer = ({ files, viewMode, loading, loadError, searchTerm, actions }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
        </div>
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">
          Syncing your vault…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 rounded-[2rem] border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl"
      >
        <div className="h-14 w-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-500/20">
          <Loader2 className="h-7 w-7" />
        </div>
        <p className="text-rose-400 font-bold text-sm uppercase tracking-wider">Storage Sync Failed</p>
        <p className="text-slate-500 text-xs mt-2 max-w-[280px] text-center leading-relaxed">
          We encountered an issue connecting to your vault. Please verify your connection.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest rounded-xl border border-rose-500/20 transition-all"
        >
          Retry Connection
        </button>
      </motion.div>
    );
  }

  if (files.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 rounded-[2rem] border-2 border-dashed border-white/[0.05] bg-white/[0.01]"
      >
        <div className="h-16 w-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-600 mb-6 border border-white/[0.05]">
          {searchTerm ? <Search className="h-7 w-7" /> : <Upload className="h-7 w-7" />}
        </div>
        <p className="text-slate-200 font-bold text-lg">Your vault is empty</p>
        <p className="text-slate-500 text-sm mt-2 max-w-[260px] text-center leading-relaxed">
          {searchTerm 
            ? `No files matching "${searchTerm}" were found in your vault.` 
            : 'Start by uploading your first file to see it here in the vault.'}
        </p>
        {searchTerm && (
          <button 
            onClick={() => actions.resetSearch()}
            className="mt-6 text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-widest transition-all"
          >
            Clear Search Filter
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className={viewMode === 'grid' 
      ? "grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" 
      : "flex flex-col"
    }>
      <AnimatePresence mode="popLayout" initial={false}>
        {files.map(file => (
          <FileItem 
            key={file.fileId} 
            file={file} 
            viewMode={viewMode} 
            actions={actions} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FileContainer;
