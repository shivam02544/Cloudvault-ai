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
    <div className="min-h-screen bg-gradient-animated selection:bg-blue-500/30">
      
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] animate-pulse-slow" />
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
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Controller</h1>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">CloudVault AI Intelligence</p>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.nav 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-1.5 p-1.5 glass rounded-2xl border border-white/[0.05]"
          >
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all relative ${
                  activeTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="adminTab"
                    className="absolute inset-0 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                  />
                )}
                <tab.icon size={14} className="relative z-10" />
                <span className="text-[10px] font-black uppercase tracking-widest relative z-10 hidden sm:inline">{tab.label}</span>
                {tab.id === 'moderation' && riskyFiles.length > 0 && (
                  <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] font-black text-white shadow-lg shadow-rose-600/30">
                    {riskyFiles.length}
                  </span>
                )}
              </button>
            ))}
          </motion.nav>
        </header>

        {/* ── Content View ── */}
        <main>
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


          {error && (
            <div className="mt-8 p-6 glass border border-rose-500/20 rounded-3xl text-center">
              <AlertTriangle className="mx-auto text-rose-500 mb-4" size={32} />
              <p className="text-sm font-bold text-rose-400 uppercase tracking-widest">Protocol Deviation Detected</p>
              <p className="text-xs text-slate-500 mt-2">{error}</p>
              <button 
                onClick={admin.actions.fetchStats}
                className="mt-6 px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Attempt Resync
              </button>
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
