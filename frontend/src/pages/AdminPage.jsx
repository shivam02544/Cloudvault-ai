import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, HardDrive, Filter, ArrowLeft, Loader2, ShieldCheck, Database } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const AdminPage = () => {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riskyFiles, setRiskyFiles] = useState([]);
  const [modLoading, setModLoading] = useState(false);


  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchAdminStats = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Admin stats fetch error:', err);
        setError(err.response?.data?.message || 'Failed to fetch platform metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, [token, isAdmin, navigate]);

  const fetchRiskyFiles = async () => {
    try {
      setModLoading(true);
      const res = await axios.get(`${API_URL}/admin/moderation/risky`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRiskyFiles(res.data.files || []);
    } catch (err) {
      console.error('Moderation fetch error:', err);
    } finally {
      setModLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'moderation') {
      fetchRiskyFiles();
    }
  }, [activeTab]);

  const handleMarkSafe = async (targetUserId, fileId) => {
    try {
      await axios.post(`${API_URL}/admin/moderation/mark-safe`, {
        targetUserId,
        fileId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Remove from local risky list
      setRiskyFiles(prev => prev.filter(f => f.fileId !== fileId));
    } catch (err) {
      console.error('Failed to mark safe:', err);
    }
  };

  if (!isAdmin) return null;

  // Helper to format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const TABS = [
    { id: 'stats', label: 'Platform Stats', icon: LayoutDashboard },
    { id: 'moderation', label: 'AI Moderation', icon: ShieldCheck },
    { id: 'users', label: 'User Registry', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium mb-4 group"
            >
              <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">SaaS Console</h1>
                <p className="text-slate-400 mt-1">Platform-wide analytics and admin management</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-2xl border border-white/5">
             {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
             ))}
          </div>
        </div>

        {activeTab === 'stats' && (
          <>
            {/* Stats Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-slate-900/40 rounded-3xl border border-white/5 border-dashed">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-400 font-medium">Aggregating platform data...</p>
              </div>
            ) : error ? (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-8 rounded-3xl text-center">
                <h3 className="text-lg font-bold mb-2">Sync Error</h3>
                <p className="text-sm text-rose-500/80">{error}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="glass p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="h-14 w-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                    <HardDrive className="h-7 w-7" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Storage Consumed</p>
                  <h2 className="text-4xl font-bold text-white mt-2">{formatBytes(stats?.totalStorageUsed || 0)}</h2>
                </div>

                <div className="glass p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="h-14 w-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                    <Users className="h-7 w-7" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Total Active Users</p>
                  <h2 className="text-4xl font-bold text-white mt-2">{stats?.activeUserCount || 0}</h2>
                </div>

                <div className="glass p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="h-14 w-14 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                    <Database className="h-7 w-7" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Storage Infrastructure</p>
                  <h2 className="text-xl font-bold text-white mt-2">AWS Serverless</h2>
                  <p className="text-slate-500 text-xs mt-1">Region: ap-south-1</p>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'moderation' && (
           <div className="glass rounded-3xl border border-white/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                 <div>
                    <h2 className="text-xl font-bold">AI Moderation Queue</h2>
                    <p className="text-slate-500 text-sm mt-1">Reviewing flagged content with high risk scores</p>
                 </div>
                 <button 
                   onClick={fetchRiskyFiles}
                   className="p-2 text-slate-400 hover:text-white transition-all bg-white/5 rounded-xl border border-white/5 hover:border-white/10"
                   title="Refresh Queue"
                 >
                   <Database size={18} className={modLoading ? 'animate-spin text-blue-500' : ''} />
                 </button>
              </div>

              {modLoading ? (
                 <div className="p-24 text-center">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Scanning platform for risks...</p>
                 </div>
              ) : riskyFiles.length === 0 ? (
                 <div className="p-24 text-center">
                    <div className="h-16 w-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                       <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Platform is Safe</h3>
                    <p className="text-slate-500 mt-2 text-sm">No flagged content requiring manual intervention.</p>
                 </div>
              ) : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                       <thead>
                          <tr className="bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                             <th className="px-8 py-4">File / Owner</th>
                             <th className="px-8 py-4">AI Risk Report</th>
                             <th className="px-8 py-4">Status</th>
                             <th className="px-8 py-4 text-right">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {riskyFiles.map(file => (
                             <tr key={file.fileId} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-4">
                                      <div className="h-10 w-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs">
                                         {file.filename.split('.').pop()?.toUpperCase()}
                                      </div>
                                      <div>
                                         <p className="text-sm font-semibold text-slate-200">{file.filename}</p>
                                         <p className="text-[10px] text-slate-500 mt-0.5">UID: {file.userId.slice(0, 12)}...</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <div className="flex flex-wrap gap-1.5">
                                      {file.moderationLabels.map((l, i) => (
                                         <span key={i} className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-bold uppercase">
                                            {l.name} ({Math.round(l.confidence)}%)
                                         </span>
                                      ))}
                                   </div>
                                </td>
                                <td className="px-8 py-6">
                                   <span className="flex items-center gap-1.5 text-amber-500 text-[10px] font-bold uppercase">
                                      <Filter size={12} /> Pending Review
                                   </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                   <button 
                                     onClick={() => handleMarkSafe(file.userId, file.fileId)}
                                     className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                                   >
                                      Mark Safe
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              )}
           </div>
        )}

        {activeTab === 'users' && (
           <div className="glass p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-bold flex items-center gap-2">
                 <Users className="h-5 w-5 text-blue-400" />
                 User Management
               </h2>
               <div className="text-xs text-slate-500 italic">v1.3 SaaS Preview</div>
             </div>
             
             <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-12 text-center">
               <p className="text-slate-400 text-sm font-medium">User detailed management is coming in v1.4</p>
               <p className="text-slate-600 text-xs mt-2 italic">Role editing and user suspension features under development.</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

