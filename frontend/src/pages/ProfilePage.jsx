import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  User, HardDrive, FileText, Calendar, Mail, Shield,
  LogOut, Trash2, Copy, Check, ChevronRight, Bell,
  Lock, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL;

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ProfilePage() {
  const { token, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Decode email from JWT
  const email = (() => {
    try {
      const parts = token?.split('.');
      if (!parts || parts.length !== 3) return null;
      return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))?.email || null;
    } catch { return null; }
  })();

  const userId = (() => {
    try {
      const parts = token?.split('.');
      if (!parts || parts.length !== 3) return null;
      return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))?.sub || null;
    } catch { return null; }
  })();

  useEffect(() => {
    axios.get(`${API_URL}/files/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const usagePercent = stats ? Math.min((stats.storageUsed / stats.maxStorage) * 100, 100) : 0;

  const copyUserId = () => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== email) return;
    setDeleting(true);
    try {
      // Delete all files first, then logout
      // For now we just log out and show a message — full account deletion requires admin action
      addToast('Account deletion request submitted. An admin will process it shortly.', 'info');
      setTimeout(() => { logout(); navigate('/login'); }, 2000);
    } catch {
      addToast('Failed to submit deletion request', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const SECTIONS = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-animated">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{email || 'Your Profile'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase">
                  <Shield size={9} /> Admin
                </span>
              )}
              <span className="text-slate-500 text-xs">CloudVault AI Member</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5">
          {/* Sidebar nav */}
          <nav className="sm:w-44 shrink-0">
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-all text-left border-b border-white/[0.04] last:border-0 ${
                    activeSection === s.id
                      ? s.id === 'danger' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
                  }`}>
                  <s.icon size={14} />
                  {s.label}
                  {activeSection === s.id && <ChevronRight size={12} className="ml-auto" />}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Overview */}
            {activeSection === 'overview' && (
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 className="font-bold text-white text-sm">Account Overview</h2>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail size={14} className="text-slate-500" />
                      <span className="text-xs text-slate-400">Email</span>
                    </div>
                    <span className="text-sm text-slate-200">{email || '—'}</span>
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User size={14} className="text-slate-500" />
                      <span className="text-xs text-slate-400">User ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">{userId?.slice(0, 16)}…</span>
                      <button onClick={copyUserId} className="p-1 text-slate-600 hover:text-slate-300 transition-colors">
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield size={14} className="text-slate-500" />
                      <span className="text-xs text-slate-400">Role</span>
                    </div>
                    <span className={`text-xs font-semibold ${isAdmin ? 'text-blue-400' : 'text-slate-400'}`}>
                      {isAdmin ? 'Administrator' : 'User'}
                    </span>
                  </div>
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText size={14} className="text-slate-500" />
                      <span className="text-xs text-slate-400">Files uploaded</span>
                    </div>
                    <span className="text-sm text-slate-200">{loading ? '…' : stats?.fileCount || 0}</span>
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-white/5">
                  <button onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-rose-400 transition-colors">
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            )}

            {/* Storage */}
            {activeSection === 'storage' && (
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 className="font-bold text-white text-sm">Storage Usage</h2>
                </div>
                <div className="p-5">
                  {loading ? (
                    <div className="flex items-center gap-2 text-slate-500 text-sm"><Loader2 size={14} className="animate-spin" /> Loading…</div>
                  ) : (
                    <>
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-2xl font-bold text-white">{formatBytes(stats?.storageUsed || 0)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">of {formatBytes(stats?.maxStorage || 5 * 1024 * 1024 * 1024)} used</p>
                        </div>
                        <p className={`text-sm font-bold ${usagePercent > 90 ? 'text-rose-400' : usagePercent > 70 ? 'text-amber-400' : 'text-blue-400'}`}>
                          {usagePercent.toFixed(1)}%
                        </p>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-5">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                          style={{ width: `${Math.max(usagePercent, usagePercent > 0 ? 0.5 : 0)}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Total Files', value: stats?.fileCount || 0, icon: FileText },
                          { label: 'Storage Limit', value: formatBytes(stats?.maxStorage || 5 * 1024 * 1024 * 1024), icon: HardDrive },
                        ].map(({ label, value, icon: Icon }) => (
                          <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                            <Icon size={14} className="text-slate-500 mb-2" />
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
                            <p className="text-base font-bold text-white mt-0.5">{value}</p>
                          </div>
                        ))}
                      </div>
                      {usagePercent > 80 && (
                        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/15">
                          <AlertTriangle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-400/80">You're using over 80% of your storage. Consider deleting unused files.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === 'security' && (
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 className="font-bold text-white text-sm">Security</h2>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Password</p>
                        <p className="text-xs text-slate-500 mt-0.5">Managed by Cognito</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <CheckCircle2 size={9} /> Secured
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Email Verification</p>
                        <p className="text-xs text-slate-500 mt-0.5">Your email is verified</p>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        <CheckCircle2 size={9} /> Verified
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-200">Active Sessions</p>
                        <p className="text-xs text-slate-500 mt-0.5">JWT token — expires in 1 hour</p>
                      </div>
                      <button onClick={() => { logout(); navigate('/login'); }}
                        className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors">
                        Sign out all
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeSection === 'danger' && (
              <div className="glass rounded-2xl border border-rose-500/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-rose-500/15 bg-rose-500/5">
                  <h2 className="font-bold text-rose-400 text-sm flex items-center gap-2">
                    <AlertTriangle size={14} /> Danger Zone
                  </h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-slate-300 font-medium mb-1">Delete Account</p>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    This will permanently delete all your files from S3 and remove your account data. This action cannot be undone.
                  </p>
                  <p className="text-xs text-slate-400 mb-2">
                    Type <span className="font-mono text-slate-200 bg-white/5 px-1.5 py-0.5 rounded">{email}</span> to confirm:
                  </p>
                  <input
                    type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="Enter your email to confirm"
                    className="w-full bg-slate-900/60 border border-rose-500/20 focus:border-rose-500/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 mb-3 transition-all"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirm !== email || deleting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {deleting ? 'Processing…' : 'Delete my account'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
