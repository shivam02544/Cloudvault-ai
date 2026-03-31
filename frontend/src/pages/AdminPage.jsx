import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  { id: 'users', label: 'Users', icon: Users },
  { id: 'explorer', label: 'Files', icon: FolderOpen },
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
    users, usersNextToken, usersLoading,
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
      
      {/* Background Layer (Static) */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-50" />
         <div className="absolute inset-0 bg-grid-mesh opacity-20" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 pb-20">
        
        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-700">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-all group"
            >
              <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>
            
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white uppercase italic">
                  Admin Portal
                </h1>
                <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.4em] mt-2 ml-1">Secure Cloud Management</p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 p-1.5 sm:p-2 glass-premium rounded-2xl sm:rounded-[1.5rem] border border-white/[0.05] shadow-2xl relative overflow-x-auto no-scrollbar animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="flex items-center gap-1 font-sans">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-500 relative group flex-shrink-0 ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 bg-blue-600/20 border border-blue-500/30 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.15)] animate-in fade-in zoom-in-95 duration-300" />
                  )}
                  <tab.icon size={14} className={`relative z-10 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] relative z-10">{tab.label}</span>
                  
                  {tab.id === 'moderation' && riskyFiles.length > 0 && (
                    <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] font-black text-white shadow-lg shadow-rose-600/40 border border-white/10">
                      {riskyFiles.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </header>

        {/* ── Content View ── */}
        <main className="relative">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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
          </div>

          {error && (
            <div className="mt-12 p-10 glass-premium border border-rose-500/20 rounded-[3rem] text-center relative overflow-hidden group animate-in fade-in zoom-in-95">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-rose-500 group-hover:scale-110 transition-transform duration-1000">
                <AlertTriangle size={120} />
              </div>
              <AlertTriangle className="mx-auto text-rose-500 mb-4" size={32} />
              <p className="text-sm font-black text-rose-400 uppercase tracking-[0.4em] italic mb-2">System Error Detected</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">{error}</p>
              <button 
                onClick={admin.actions.fetchStats}
                className="mt-6 px-8 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:-translate-y-1"
              >
                Retry Sync
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ── Modals Layer (Standard Rendering) ── */}
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
          onSaved={admin.actions.fetchUsers}
        />
      )}
      {previewFile && (
        <AdminPreviewModal 
          file={previewFile.file || previewFile} 
          url={previewFile.url} 
          onClose={() => setPreviewFile(null)} 
        />
      )}
    </div>
  );
};

export default AdminPage;
