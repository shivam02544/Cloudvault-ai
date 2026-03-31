import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, List as ListIcon, 
  ShieldCheck, FolderOpen, RefreshCw
} from 'lucide-react';


import Navbar from './components/Navbar';
import UploadDropzone from './components/UploadDropzone';
import PreviewModal from './components/PreviewModal';
import ShareModal from './components/ShareModal';
import VaultStats from './components/VaultStats';
import FileFilter from './components/FileFilter';
import FileContainer from './components/FileContainer';
import VaultSettings from './components/VaultSettings';

import { useAuth } from './context/AuthContext';
import { useVault } from './hooks/useVault';
import { useState } from 'react';

function App() {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const vault = useVault();
  const [showSettings, setShowSettings] = useState(false);

  const {
    files, stats, loading, loadError,
    viewMode, setViewMode,
    activeCategory, setActiveCategory,
    searchTerm, setSearchTerm,
    previewData, setPreviewData,
    shareFile, setShareFile,
    usagePercent, actions
  } = vault;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-animated selection:bg-blue-500/30">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                My Vault
                {isAdmin && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-1.5 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-bold uppercase tracking-widest hover:bg-blue-500/20 transition-all cursor-pointer"
                  >
                    <ShieldCheck size={11} /> Admin Portal
                  </motion.button>
                )}
              </h1>
            </div>
            <VaultStats usagePercent={usagePercent} />
          </motion.div>

          {/* Controls */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            {/* Settings Toggle */}
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="p-3 glass rounded-2xl border border-white/[0.05] text-slate-500 hover:text-white transition-all flex items-center justify-center relative group"
            >
              <div className="absolute inset-0 bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-all" />
              <div className="relative z-10 flex items-center gap-2">
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-700" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:inline">Initialize Reset</span>
              </div>
            </motion.button>

            {/* View Toggles */}
            <div className="flex items-center gap-1.5 p-1.5 glass rounded-2xl border border-white/[0.05]">
              {[
                { id: 'grid', icon: LayoutGrid, label: 'Grid' },
                { id: 'list', icon: ListIcon, label: 'List' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all relative ${
                    viewMode === id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  aria-label={`${label} View`}
                >
                  {viewMode === id && (
                    <motion.div 
                      layoutId="viewMode"
                      className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="text-xs font-bold uppercase tracking-widest relative z-10 hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Main Operations ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Upload & Filters */}
          <div className="lg:col-span-4 space-y-8 sticky top-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <UploadDropzone onUploadSuccess={actions.handleUploadSuccess} token={token} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6 border border-white/[0.05] rounded-[2rem]"
            >
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FolderOpen className="h-3 w-3" /> Navigation & Search
              </h3>
              <FileFilter 
                activeCategory={activeCategory} 
                setActiveCategory={setActiveCategory}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </motion.div>
          </div>

          {/* Right Column: File Display */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="lg:col-span-8"
          >
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                Latest Activity
              </h2>
              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                Showing {files.length} / {vault.totalFiles} files
              </span>
            </div>

            <FileContainer 
              files={files}
              viewMode={viewMode}
              loading={loading}
              loadError={loadError}
              searchTerm={searchTerm}
              actions={{
                ...actions,
                onShare: setShareFile,
                resetSearch: () => setSearchTerm('')
              }}
            />
          </motion.div>
        </div>
      </main>

      {/* ── Modals Layer ── */}
      <AnimatePresence>
        {previewData && (
          <PreviewModal 
            file={previewData.file} 
            url={previewData.url} 
            token={token} 
            onUpdate={actions.handleUpdateFile} 
            onClose={() => setPreviewData(null)} 
          />
        )}
        {shareFile && (
          <ShareModal 
            file={shareFile} 
            onClose={() => setShareFile(null)} 
            onUpdate={actions.handleUpdateFile} 
            token={token} 
          />
        )}
        {showSettings && (
          <VaultSettings 
            onClose={() => setShowSettings(false)} 
            onReset={actions.handleResetVault} 
          />
        )}
      </AnimatePresence>

      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full" />
      </div>
    </div>
  );
}

export default App;

