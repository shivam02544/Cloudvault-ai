import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, LayoutDashboard, Users, FolderOpen, 
  ArrowLeft, RefreshCw, AlertTriangle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../hooks/useAdmin';

import AdminStats from '../components/AdminStats';
import AdminUserRegistry from '../components/AdminUserRegistry';
import AdminExplorer from '../components/AdminExplorer';
import AdminModeration from '../components/AdminModeration';
import { AdminNotifyModal, AdminLimitsModal, AdminPreviewModal } from '../components/AdminModals';

const TABS = [
  { id: 'stats', label: 'Overview', icon: LayoutDashboard },
  { id: 'users', label: 'Identity', icon: Users },
  { id: 'explorer', label: 'Storage', icon: FolderOpen },
  { id: 'moderation', label: 'Safety', icon: ShieldCheck },
];

const AdminPage = () => {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const admin = useAdmin();

  // Local UI Modal States
  const [notifyUser, setNotifyUser] = useState(null);
  const [limitsUser, setLimitsUser] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const handlePreview = async (file) => {
    const url = await admin.actions.fetchFileUrl(file.userId, file.fileId);
    if (url) setPreviewFile({ file, url });
  };

  const {

    activeTab, setActiveTab,
    stats, loading, error,
    users, usersNextToken, usersLoading, suspendingId,
    files, filesNextToken, filesLoading, deletingId,
    riskyFiles, modLoading, selectedMod, setSelectedMod,
    actions
  } = admin;

  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#05080f] selection:bg-blue-500/30 relative overflow-hidden" id="admin-page">
      
      {/* Neural Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-50" />
         <div className="absolute inset-0 bg-grid-mesh opacity-30" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-600/5 blur-[150px] rounded-full animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        
        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-all group"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>
            
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white uppercase italic relative group/glitch">
                  <span className="relative z-10">Controller</span>
                  <span className="absolute inset-0 text-rose-500/30 translate-x-[2px] translate-y-[1px] opacity-0 group-hover/glitch:opacity-100 group-hover/glitch:animate-glitch-1 pointer-events-none transition-opacity">Controller</span>
                  <span className="absolute inset-0 text-blue-500/30 translate-x-[-2px] translate-y-[-1px] opacity-0 group-hover/glitch:opacity-100 group-hover/glitch:animate-glitch-2 pointer-events-none transition-opacity">Controller</span>
                </h1>
                <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.4em] mt-2 ml-1">CloudVault AI Intelligence</p>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.nav 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 p-2 glass-premium rounded-[1.5rem] border border-white/[0.05] shadow-2xl relative overflow-hidden"
          >
            {/* Animated Highlight Background */}
            <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 pointer-events-none" />

            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl transition-all duration-500 relative group ${
                  activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="adminTabGlow"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                    className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                  />
                )}
                <tab.icon size={15} className={`relative z-10 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10 hidden lg:inline">{tab.label}</span>
                
                {tab.id === 'moderation' && riskyFiles.length > 0 && (
                  <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] font-black text-white shadow-lg shadow-rose-600/40 border border-white/10">
                    {riskyFiles.length}
                  </span>
                )}
              </button>
            ))}
          </motion.nav>
        </header>

        {/* ── Content View ── */}
        <main className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.99 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'stats' && (
                <AdminStats 
                  stats={stats} 
                  riskyCount={riskyFiles.length}
                  onTabChange={setActiveTab}
                />
              )}

              {activeTab === 'users' && (
                <AdminUserRegistry 
                  users={users}
                  loading={usersLoading}
                  suspendingId={suspendingId}
                  onAction={admin.actions.approveUser}
                  onNotify={setNotifyUser}
                  onLimits={setLimitsUser}
                />
              )}

              {activeTab === 'explorer' && (
                <AdminExplorer 
                  files={files}
                  loading={filesLoading}
                  deletingId={deletingId}
                  onPreview={handlePreview}
                  onDelete={admin.actions.deleteFile}
                  onNext={() => admin.actions.fetchFiles(filesNextToken)}
                  hasNext={!!filesNextToken}
                />
              )}

              {activeTab === 'moderation' && (
                <AdminModeration 
                  files={riskyFiles}
                  loading={modLoading}
                  selectedMod={selectedMod}
                  setSelectedMod={setSelectedMod}
                  onPreview={handlePreview}
                  onMarkSafe={admin.actions.markSafe}
                  onDelete={admin.actions.deleteFile}
                  onRefresh={admin.actions.fetchRiskyFiles}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <div className="mt-12 p-10 glass-premium border border-rose-500/20 rounded-[3rem] text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-rose-500 group-hover:scale-110 transition-transform duration-1000">
                <AlertTriangle size={160} />
              </div>
              <AlertTriangle className="mx-auto text-rose-500 mb-6 drop-shadow-lg" size={40} />
              <p className="text-sm font-black text-rose-400 uppercase tracking-[0.4em] italic mb-2">Protocol Deviation Detected</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">{error}</p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={admin.actions.fetchStats}
                className="mt-8 px-10 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
              >
                Force Re-Synchronization
              </motion.button>
            </div>
          )}
        </main>
      </div>

      {/* ── Modals Layer ── */}
      <AnimatePresence>
        {notifyUser && (
          <AdminNotifyModal 
            user={notifyUser} 
            token={token} 
            onClose={() => setNotifyUser(null)} 
          />
        )}
        {limitsUser && (
          <AdminLimitsModal 
            user={limitsUser} 
            token={token} 
            onClose={() => setLimitsUser(null)}
            onSaved={admin.actions.fetchUsers} // Simple refresh
          />
        )}
        {previewFile && (
          <AdminPreviewModal 
            file={previewFile.file || previewFile} 
            url={previewFile.url} 
            onClose={() => setPreviewFile(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
