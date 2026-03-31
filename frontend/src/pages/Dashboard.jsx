import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, List as ListIcon, 
  ShieldCheck, FolderOpen, RefreshCw, Zap, Activity, HardDrive
} from 'lucide-react';

import Navbar from '../components/Navbar';
import UploadDropzone from '../components/UploadDropzone';
import PreviewModal from '../components/PreviewModal';
import ShareModal from '../components/ShareModal';
import VaultStats from '../components/VaultStats';
import FileFilter from '../components/FileFilter';
import FileContainer from '../components/FileContainer';
import VaultSettings from '../components/VaultSettings';

import { useAuth } from '../context/AuthContext';
import { useVault } from '../hooks/useVault';
import { useState } from 'react';

const Dashboard = () => {
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

  return (
    <div className="min-h-screen flex flex-col bg-[#05080f] selection:bg-blue-500/30 relative overflow-hidden" id="dashboard">
      
      {/* Background Layer (Static) */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-50" />
         <div className="absolute inset-0 bg-grid-mesh opacity-20" />
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full" />
         <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] rounded-full" />
      </div>

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 sm:mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-4 transition-all">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
                <HardDrive className="size-6 sm:size-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-white italic uppercase leading-none">
                    My Vault
                  </h1>
                  {isAdmin && (
                    <button 
                      onClick={() => navigate('/admin')}
                      className="flex items-center gap-2 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] backdrop-blur-md hover:bg-blue-500/20 transition-all cursor-pointer shadow-lg shadow-blue-500/10 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <ShieldCheck size={12} /> Admin Portal
                    </button>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mt-2 ml-1">Secure Cloud Storage</p>
              </div>
            </div>
            <VaultStats usagePercent={usagePercent} />
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="flex-1 sm:flex-none px-6 py-4 glass-premium rounded-2xl border border-white/[0.08] text-slate-400 hover:text-white transition-all flex items-center justify-center relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-all" />
              <div className="relative z-10 flex items-center gap-3">
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-1000" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]">Refresh Vault</span>
              </div>
            </button>

            <div className="flex-1 sm:flex-none flex items-center gap-2 p-1.5 sm:p-2 glass-premium rounded-2xl sm:rounded-[1.5rem] border border-white/[0.08] shadow-2xl">
              {[
                { id: 'grid', icon: LayoutGrid, label: 'Grid' },
                { id: 'list', icon: ListIcon, label: 'List' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-500 relative ${
                    viewMode === id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {viewMode === id && (
                    <div className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.15)] animate-in fade-in zoom-in-95 duration-300" />
                  )}
                  <Icon size={14} className="relative z-10" />
                  <span className="text-[10px] font-black uppercase tracking-widest relative z-10 hidden xs:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Operations ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Upload & Filters */}
          <div className="lg:col-span-4 space-y-8 lg:space-y-10 lg:sticky lg:top-24">
            <div className="animate-in fade-in zoom-in-95 duration-700">
              <UploadDropzone onUploadSuccess={actions.handleUploadSuccess} token={token} />
            </div>

            <div className="glass-premium p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-white/[0.05] relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-blue-500 pointer-events-none">
                <Zap size={100} />
              </div>
              
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                <FolderOpen size={14} className="text-blue-500" /> Navigation Core
              </h3>
              <FileFilter 
                activeCategory={activeCategory} 
                setActiveCategory={setActiveCategory}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </div>
          </div>

          {/* Right Column: File Display */}
          <div className="lg:col-span-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 px-6 py-5 sm:py-4 glass-premium rounded-[2rem] border border-white/[0.05] relative overflow-hidden group gap-4 sm:gap-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.02] to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
              
              <div className="flex items-center gap-4 relative z-10 w-full sm:w-auto">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-sm shadow-blue-500/10 animate-pulse">
                  <Activity size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white italic uppercase tracking-[0.2em] leading-none mb-1">
                    Vault Analytics
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">System Sync Active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 relative z-10 w-full sm:w-auto justify-end sm:justify-start">
                 <div className="bg-slate-900/50 border border-white/[0.05] rounded-xl px-4 py-2 flex flex-col items-center min-w-[70px] sm:min-w-[80px]">
                    <span className="text-[12px] font-black font-mono text-blue-400 tracking-tighter leading-none">{(files?.length || 0).toString().padStart(3, '0')}</span>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Files</span>
                 </div>
                 <div className="bg-slate-900/50 border border-white/[0.05] rounded-xl px-4 py-2 flex flex-col items-center min-w-[70px] sm:min-w-[80px]">
                    <span className="text-[12px] font-black font-mono text-emerald-400 tracking-tighter leading-none">1.2ms</span>
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Latency</span>
                 </div>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-450">
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
            </div>
          </div>
        </div>
      </main>

      {/* ── Modals Layer (Standard CSS Rendering) ── */}
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

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/5 blur-[150px]" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 blur-[150px]" />
      </div>
    </div>
  );
};

export default Dashboard;
