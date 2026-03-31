import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FolderOpen, ShieldCheck, HardDrive,
  Filter, ArrowLeft, Loader2, Database, Trash2, Eye, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, X, Download, ExternalLink,
  FileQuestion, Bell, Settings, Send, ChevronDown, ChevronUp,
  Tag, UserCheck, UserX, Sliders, Clock
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const TABS = [
  { id: 'stats',      label: 'Overview',    icon: LayoutDashboard },
  { id: 'users',      label: 'Users',        icon: Users },
  { id: 'explorer',   label: 'Explorer',     icon: FolderOpen },
  { id: 'moderation', label: 'Moderation',   icon: ShieldCheck },
];

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ExtBadge = ({ filename }) => {
  const ext = filename?.split('.').pop()?.toUpperCase() || '?';
  const colors = {
    JPG: 'bg-violet-500/20 text-violet-300', JPEG: 'bg-violet-500/20 text-violet-300',
    PNG: 'bg-blue-500/20 text-blue-300', GIF: 'bg-pink-500/20 text-pink-300',
    MP4: 'bg-rose-500/20 text-rose-300', MOV: 'bg-rose-500/20 text-rose-300',
    PDF: 'bg-amber-500/20 text-amber-300', ZIP: 'bg-slate-500/20 text-slate-300',
  };
  return (
    <span className={`inline-flex items-center justify-center h-8 w-10 rounded-lg text-[9px] font-black shrink-0 ${colors[ext] || 'bg-slate-700/60 text-slate-400'}`}>
      {ext}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  if (status === 'suspended') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20"><XCircle size={9}/> Suspended</span>;
  if (status === 'pending') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock size={9}/> Pending</span>;
  if (status === 'denied') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20"><XCircle size={9}/> Denied</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 size={9}/> Active</span>;
};

const getFileCategory = (filename, contentType) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  const mime = contentType?.toLowerCase() || '';
  if (mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (mime.startsWith('video/') || ['mp4','mov','webm','avi','mkv'].includes(ext)) return 'video';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('audio/') || ['mp3','wav','ogg','flac'].includes(ext)) return 'audio';
  return 'other';
};

/* ── Admin preview modal ── */
const PreviewModal = ({ file, url, onClose }) => {
  const cat = getFileCategory(file.filename, file.contentType);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative min-h-full flex items-start sm:items-center justify-center p-4">
        <div className="relative z-10 w-full sm:max-w-3xl bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#0f172a]/95 backdrop-blur-sm border-b border-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <ExtBadge filename={file.filename} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{file.filename}</p>
                <p className="text-[10px] text-slate-500">{formatBytes(file.size)} · {file.contentType}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-3">
              <a href={url} download={file.filename} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all"><Download size={14} /></a>
              <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all"><ExternalLink size={14} /></a>
              <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"><X size={14} /></button>
            </div>
          </div>
          <div className="flex items-center justify-center bg-slate-950/50 min-h-[200px] p-4">
            {cat === 'image' && <img src={url} alt={file.filename} className="max-w-full max-h-[65vh] object-contain rounded-lg" />}
            {cat === 'video' && <video src={url} controls autoPlay className="max-w-full max-h-[65vh] rounded-lg w-full" />}
            {cat === 'audio' && <div className="p-8 flex flex-col items-center gap-5"><div className="h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400"><FileQuestion size={28} /></div><audio src={url} controls className="w-full max-w-xs" /></div>}
            {cat === 'pdf' && <iframe src={url} title={file.filename} className="w-full h-[65vh] border-0 rounded-lg" />}
            {cat === 'other' && <div className="p-10 flex flex-col items-center gap-4 text-center"><div className="h-16 w-16 rounded-2xl bg-slate-700/40 flex items-center justify-center"><FileQuestion size={28} className="text-slate-500" /></div><p className="text-slate-400 font-medium text-sm">Preview not available</p><a href={url} download={file.filename} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 transition-all"><Download size={13} /> Download</a></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Notify User Modal ── */
const NotifyModal = ({ user, token, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API_URL}/admin/users/${user.userId}/notify`,
        { targetUserId: user.userId, subject, message, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSent(true);
      setTimeout(onClose, 1500);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2"><Bell size={14} className="text-blue-400" /> Notify User</h3>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"><X size={14} /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">Sending to: <span className="text-slate-300">{user.email || user.userId.slice(0, 16) + '…'}</span></p>

        {sent ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm py-4 justify-center">
            <CheckCircle2 size={16} /> Notification sent!
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              {['info', 'warning', 'success'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all border ${
                    type === t
                      ? t === 'info' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : t === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                  }`}>{t}</button>
              ))}
            </div>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
              className="w-full bg-slate-900/60 border border-white/[0.08] focus:border-blue-500/40 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 mb-2.5 transition-all" />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message…" rows={4}
              className="w-full bg-slate-900/60 border border-white/[0.08] focus:border-blue-500/40 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 mb-3 transition-all resize-none" />
            <button onClick={send} disabled={sending || !subject.trim() || !message.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Sending…' : 'Send Notification'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* ── User Limits Modal ── */
const LimitsModal = ({ user, token, onClose, onSaved }) => {
  const GB = 1024 * 1024 * 1024;
  const [storageGB, setStorageGB] = useState(((user.storageLimit || 5 * GB) / GB).toString());
  const [maxFileMB, setMaxFileMB] = useState(((user.maxFileSize || 1024 * 1024 * 1024) / (1024 * 1024)).toString());
  const [notes, setNotes] = useState(user.notes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/admin/users/${user.userId}/limits`,
        {
          storageLimit: parseFloat(storageGB) * GB,
          maxFileSize: parseFloat(maxFileMB) * 1024 * 1024,
          notes,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSaved({ ...user, storageLimit: parseFloat(storageGB) * GB, maxFileSize: parseFloat(maxFileMB) * 1024 * 1024, notes });
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2"><Sliders size={14} className="text-purple-400" /> User Limits</h3>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"><X size={14} /></button>
        </div>
        <p className="text-xs text-slate-500 mb-4">{user.email || user.userId.slice(0, 16) + '…'}</p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Storage Limit (GB)</label>
            <input type="number" min="0.1" max="100" step="0.5" value={storageGB} onChange={e => setStorageGB(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3 py-2 text-sm text-slate-200 transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Max File Size (MB)</label>
            <input type="number" min="1" max="10240" step="1" value={maxFileMB} onChange={e => setMaxFileMB(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3 py-2 text-sm text-slate-200 transition-all" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">Admin Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Internal notes about this user…"
              className="w-full bg-slate-900/60 border border-white/[0.08] focus:border-purple-500/40 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 resize-none transition-all" />
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-40">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {saving ? 'Saving…' : 'Save Limits'}
        </button>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riskyFiles, setRiskyFiles] = useState([]);
  const [modLoading, setModLoading] = useState(false);
  const [selectedMod, setSelectedMod] = useState(new Set());
  const [users, setUsers] = useState([]);
  const [usersNextToken, setUsersNextToken] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [suspendingId, setSuspendingId] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [notifyUser, setNotifyUser] = useState(null);
  const [limitsUser, setLimitsUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [filesNextToken, setFilesNextToken] = useState(null);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState(null);
  const [previewError, setPreviewError] = useState({});
  const [deletingId, setDeletingId] = useState(null);
  const [previewModal, setPreviewModal] = useState(null);
  const [explorerSearch, setExplorerSearch] = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setStats(r.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to fetch metrics'))
      .finally(() => setLoading(false));
    axios.get(`${API_URL}/admin/moderation/risky`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setRiskyFiles(r.data.files || []))
      .catch(() => {});
  }, [token, isAdmin, navigate]);

  const fetchRiskyFiles = () => {
    setModLoading(true);
    axios.get(`${API_URL}/admin/moderation/risky`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { setRiskyFiles(r.data.files || []); setSelectedMod(new Set()); })
      .catch(console.error).finally(() => setModLoading(false));
  };

  const fetchUsers = async (nextToken = null) => {
    setUsersLoading(true); setUsersError(null);
    try {
      const url = nextToken ? `${API_URL}/admin/users?nextToken=${encodeURIComponent(nextToken)}` : `${API_URL}/admin/users`;
      const r = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => nextToken ? [...prev, ...r.data.users] : r.data.users);
      setUsersNextToken(r.data.nextToken || null);
    } catch (e) { setUsersError(e.response?.data?.message || 'Failed to load users'); }
    finally { setUsersLoading(false); }
  };

  const fetchFiles = async (nextToken = null) => {
    setFilesLoading(true); setFilesError(null);
    try {
      const url = nextToken ? `${API_URL}/admin/files?nextToken=${encodeURIComponent(nextToken)}` : `${API_URL}/admin/files`;
      const r = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(prev => nextToken ? [...prev, ...r.data.files] : r.data.files);
      setFilesNextToken(r.data.nextToken || null);
    } catch (e) { setFilesError(e.response?.data?.message || 'Failed to load files'); }
    finally { setFilesLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'moderation') fetchRiskyFiles();
    if (activeTab === 'users' && users.length === 0) fetchUsers();
    if (activeTab === 'explorer' && files.length === 0) fetchFiles();
  }, [activeTab]);

  const handleToggleSuspend = async (user) => {
    const action = user.status === 'suspended' ? 'activate' : 'suspend';
    setSuspendingId(user.userId);
    try {
      await axios.post(`${API_URL}/admin/users/${user.userId}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => u.userId === user.userId ? { ...u, status: action === 'suspend' ? 'suspended' : 'active' } : u));
    } catch (e) { console.error(e); }
    finally { setSuspendingId(null); }
  };

  const handleApproveUser = async (user, action) => {
    setSuspendingId(user.userId);
    try {
      await axios.post(`${API_URL}/admin/users/${user.userId}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => u.userId === user.userId ? { ...u, status: action === 'approve' ? 'active' : 'denied' } : u));
    } catch (e) { console.error(e); }
    finally { setSuspendingId(null); }
  };

  const handlePreview = async (file) => {
    setPreviewError(prev => ({ ...prev, [file.fileId]: null }));
    try {
      const r = await axios.get(`${API_URL}/files/${file.fileId}/url?targetUserId=${file.userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setPreviewModal({ file, url: r.data.url });
    } catch { setPreviewError(prev => ({ ...prev, [file.fileId]: 'Preview failed' })); }
  };

  const handleAdminDelete = async (file) => {
    setDeletingId(file.fileId);
    try {
      await axios.delete(`${API_URL}/admin/files/${file.userId}/${file.fileId}`, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(prev => prev.filter(f => f.fileId !== file.fileId));
    } catch (e) { console.error('Admin delete error:', e); }
    finally { setDeletingId(null); }
  };

  const handleModerationDelete = async (file) => {
    try {
      await axios.delete(`${API_URL}/admin/files/${file.userId}/${file.fileId}`, { headers: { Authorization: `Bearer ${token}` } });
      setRiskyFiles(prev => prev.filter(f => f.fileId !== file.fileId));
      setSelectedMod(prev => { const n = new Set(prev); n.delete(file.fileId); return n; });
    } catch (e) { console.error(e); }
  };

  const handleMarkSafe = async (targetUserId, fileId) => {
    try {
      await axios.post(`${API_URL}/admin/moderation/mark-safe`, { targetUserId, fileId }, { headers: { Authorization: `Bearer ${token}` } });
      setRiskyFiles(prev => prev.filter(f => f.fileId !== fileId));
      setSelectedMod(prev => { const n = new Set(prev); n.delete(fileId); return n; });
    } catch (e) { console.error(e); }
  };

  const handleBulkMarkSafe = async () => {
    const targets = riskyFiles.filter(f => selectedMod.has(f.fileId));
    await Promise.all(targets.map(f => handleMarkSafe(f.userId, f.fileId)));
  };

  const handleBulkDelete = async () => {
    const targets = riskyFiles.filter(f => selectedMod.has(f.fileId));
    await Promise.all(targets.map(f => handleModerationDelete(f)));
  };

  const filteredFiles = files.filter(f => {
    if (!explorerSearch) return true;
    const q = explorerSearch.toLowerCase();
    return (f.filename || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.userId || '').toLowerCase().includes(q) ||
      (f.tags || []).some(t => t.toLowerCase().includes(q));
  });

  if (!isAdmin) return null;

  return (
    <>
    <div className="min-h-screen bg-[#080d1a] text-slate-100 font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-600/6 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-600/6 blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors text-sm">
              <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
            </button>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-gradient-to-br from-blue-600/30 to-purple-600/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white leading-none">SaaS Console</h1>
                <p className="text-slate-500 text-[11px] mt-0.5">Platform administration</p>
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1 p-1 bg-slate-900/70 rounded-2xl border border-white/5 overflow-x-auto scrollbar-none">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`}>
                <tab.icon size={12} />{tab.label}
                {tab.id === 'moderation' && riskyFiles.length > 0 && (
                  <span className="h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">{riskyFiles.length}</span>
                )}
                {tab.id === 'users' && users.filter(u => u.status === 'pending').length > 0 && (
                  <span className="h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                    {users.filter(u => u.status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Overview ── */}
        {activeTab === 'stats' && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-white/5 border-dashed bg-slate-900/30">
                <Loader2 className="h-7 w-7 text-blue-500 animate-spin mb-3" />
                <p className="text-slate-500 text-sm">Loading metrics…</p>
              </div>
            ) : error ? (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center">
                <AlertTriangle className="h-7 w-7 mx-auto mb-2 opacity-70" />
                <p className="font-semibold text-sm">Failed to load metrics</p>
                <p className="text-xs text-rose-500/70 mt-1">{error}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  {[
                    { label: 'Storage Used', value: formatBytes(stats?.totalStorageUsed || 0), icon: HardDrive, color: 'indigo' },
                    { label: 'Active Users', value: stats?.activeUserCount || 0, icon: Users, color: 'blue' },
                    { label: 'Total Files', value: stats?.totalFileCount || 0, icon: FolderOpen, color: 'emerald' },
                    { label: 'Flagged Files', value: riskyFiles.length, icon: AlertTriangle, color: 'amber' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="glass p-4 sm:p-5 rounded-2xl border border-white/5">
                      <div className={`h-9 w-9 bg-${color}-600/10 rounded-xl flex items-center justify-center text-${color}-400 mb-3`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
                      <p className="text-xl sm:text-2xl font-bold text-white mt-1 leading-none">{value}</p>
                    </div>
                  ))}
                </div>
                {/* Quick actions */}
                <div className="glass rounded-2xl border border-white/5 p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setActiveTab('users')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all">
                      <Users size={12} /> Manage Users
                    </button>
                    <button onClick={() => setActiveTab('moderation')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all">
                      <ShieldCheck size={12} /> Review Flagged {riskyFiles.length > 0 && `(${riskyFiles.length})`}
                    </button>
                    <button onClick={() => setActiveTab('explorer')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all">
                      <FolderOpen size={12} /> Browse Files
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Users ── */}
        {activeTab === 'users' && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {usersLoading && users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-white/5 bg-slate-900/30">
                <Loader2 className="h-7 w-7 text-blue-500 animate-spin mb-3" />
                <p className="text-slate-500 text-sm">Loading users…</p>
              </div>
            ) : usersError ? (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center text-sm">
                <p className="font-semibold">Error</p><p className="opacity-70 mt-1">{usersError}</p>
              </div>
            ) : (
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-white text-sm flex items-center gap-2"><Users className="h-4 w-4 text-blue-400" /> User Registry</h2>
                    <p className="text-slate-500 text-xs mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''}</p>
                  </div>
                  <button onClick={() => fetchUsers()} className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all">
                    <RefreshCw size={13} className={usersLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {users.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm">No users found.</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {/* Pending users first */}
                    {users.filter(u => u.status === 'pending').length > 0 && (
                      <div className="px-4 sm:px-6 py-2 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-2">
                        <Clock size={11} className="text-amber-400" />
                        <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                          {users.filter(u => u.status === 'pending').length} pending approval
                        </span>
                      </div>
                    )}
                    {users.map(user => (
                      <div key={user.userId} className="hover:bg-white/[0.02] transition-colors">
                        {/* Main row */}
                        <div className="px-4 sm:px-6 py-4 flex items-start gap-3">
                          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center text-blue-400 shrink-0 text-xs font-bold">
                            {(user.email || 'U')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-slate-200 truncate">{user.email || <span className="text-slate-500 italic text-xs">no email</span>}</p>
                              <StatusBadge status={user.status} />
                              {user.notes && <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[9px] font-semibold border border-amber-500/20">Has notes</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-xs text-slate-500">{formatBytes(user.totalBytesUsed)}</span>
                              <span className="text-xs text-slate-600">·</span>
                              <span className="text-xs text-slate-500">{user.fileCount || 0} files</span>
                              {user.storageLimit && (
                                <span className="text-xs text-purple-400">Limit: {formatBytes(user.storageLimit)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setNotifyUser(user)} title="Notify" className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Bell size={13} /></button>
                            <button onClick={() => setLimitsUser(user)} title="Set limits" className="p-2 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"><Sliders size={13} /></button>
                            {user.status === 'pending' ? (
                              <>
                                <button onClick={() => handleApproveUser(user, 'approve')} disabled={suspendingId === user.userId}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 border bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border-emerald-500/20">
                                  {suspendingId === user.userId ? <Loader2 className="h-3 w-3 animate-spin" /> : '✓ Approve'}
                                </button>
                                <button onClick={() => handleApproveUser(user, 'deny')} disabled={suspendingId === user.userId}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 border bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border-rose-500/20">
                                  ✕ Deny
                                </button>
                              </>
                            ) : (
                              <button onClick={() => handleToggleSuspend(user)} disabled={suspendingId === user.userId}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 border ${
                                  user.status === 'suspended'
                                    ? 'bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-600/15 hover:bg-amber-600/25 text-amber-400 border-amber-500/20'
                                }`}>
                                {suspendingId === user.userId ? <Loader2 className="h-3 w-3 animate-spin" /> : user.status === 'suspended' ? 'Activate' : 'Suspend'}
                              </button>
                            )}
                            <button onClick={() => setExpandedUser(expandedUser === user.userId ? null : user.userId)}
                              className="p-2 text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-lg transition-all">
                              {expandedUser === user.userId ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>
                        </div>

                        {/* Expanded metadata */}
                        {expandedUser === user.userId && (
                          <div className="px-4 sm:px-6 pb-4 bg-white/[0.01]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/40 border border-white/[0.05]">
                              {[
                                { label: 'User ID', value: user.userId },
                                { label: 'Storage Used', value: formatBytes(user.totalBytesUsed) },
                                { label: 'File Count', value: user.fileCount || 0 },
                                { label: 'Storage Limit', value: formatBytes(user.storageLimit || 5 * 1024 * 1024 * 1024) },
                                { label: 'Max File Size', value: formatBytes(user.maxFileSize || 1024 * 1024 * 1024) },
                                { label: 'Status', value: user.status || 'active' },
                              ].map(({ label, value }) => (
                                <div key={label}>
                                  <p className="text-[9px] text-slate-600 uppercase tracking-wider">{label}</p>
                                  <p className="text-xs text-slate-300 font-mono mt-0.5 truncate">{String(value)}</p>
                                </div>
                              ))}
                              {user.notes && (
                                <div className="col-span-2 sm:col-span-3">
                                  <p className="text-[9px] text-slate-600 uppercase tracking-wider">Admin Notes</p>
                                  <p className="text-xs text-amber-400/80 mt-0.5">{user.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {usersNextToken && (
                  <div className="px-4 py-4 border-t border-white/5 flex justify-center">
                    <button onClick={() => fetchUsers(usersNextToken)} disabled={usersLoading}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 transition-all disabled:opacity-40">
                      {usersLoading ? <Loader2 className="h-3 w-3 animate-spin inline mr-1.5" /> : null} Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Explorer ── */}
        {activeTab === 'explorer' && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
            {filesLoading && files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-white/5 bg-slate-900/30">
                <Loader2 className="h-7 w-7 text-blue-500 animate-spin mb-3" />
                <p className="text-slate-500 text-sm">Loading files…</p>
              </div>
            ) : filesError ? (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl text-center text-sm">
                <p className="font-semibold">Error</p><p className="opacity-70 mt-1">{filesError}</p>
              </div>
            ) : (
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-white text-sm flex items-center gap-2"><FolderOpen className="h-4 w-4 text-blue-400" /> Platform Explorer</h2>
                    <p className="text-slate-500 text-xs mt-0.5">{filteredFiles.length} of {files.length} file{files.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={explorerSearch} onChange={e => setExplorerSearch(e.target.value)} placeholder="Search…"
                      className="bg-slate-900/60 border border-white/[0.08] focus:border-blue-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 w-32 sm:w-44 transition-all" />
                    <button onClick={() => fetchFiles()} className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all">
                      <RefreshCw size={13} className={filesLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {filteredFiles.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm">No files found.</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {filteredFiles.map(file => (
                      <div key={file.fileId} className="px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start gap-3">
                          <ExtBadge filename={file.filename} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-200 truncate" title={file.filename}>{file.filename}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">{file.email || `${file.userId.slice(0, 12)}…`}</span>
                              <span className="text-[10px] text-slate-600">{formatBytes(file.size)}</span>
                              <span className="text-[10px] text-slate-600">{new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</span>
                              {file.isNsfw && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase">
                                  <AlertTriangle size={7} /> NSFW
                                </span>
                              )}
                              {(file.tags || []).slice(0, 3).map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 text-[9px] font-semibold">{tag}</span>
                              ))}
                              {(file.tags || []).length > 3 && <span className="text-[9px] text-slate-600">+{file.tags.length - 3}</span>}
                            </div>
                            {previewError[file.fileId] && <p className="text-rose-400 text-[10px] mt-1">{previewError[file.fileId]}</p>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => handlePreview(file)} className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="View"><Eye size={14} /></button>
                            <button onClick={() => handleAdminDelete(file)} disabled={deletingId === file.fileId}
                              className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40" title="Delete">
                              {deletingId === file.fileId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filesNextToken && (
                  <div className="px-4 py-4 border-t border-white/5 flex justify-center">
                    <button onClick={() => fetchFiles(filesNextToken)} disabled={filesLoading}
                      className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 transition-all disabled:opacity-40">
                      {filesLoading ? <Loader2 className="h-3 w-3 animate-spin inline mr-1.5" /> : null} Load More
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── AI Moderation ── */}
        {activeTab === 'moderation' && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-rose-400" /> AI Moderation
                  {riskyFiles.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[10px] font-bold">{riskyFiles.length} flagged</span>}
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">Content flagged by Rekognition AI</p>
              </div>
              <button onClick={fetchRiskyFiles} className="p-2 text-slate-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all">
                <RefreshCw size={13} className={modLoading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Bulk actions bar */}
            {selectedMod.size > 0 && (
              <div className="px-4 sm:px-6 py-3 bg-amber-500/5 border-b border-amber-500/10 flex items-center justify-between gap-3">
                <span className="text-xs text-amber-400 font-semibold">{selectedMod.size} selected</span>
                <div className="flex items-center gap-2">
                  <button onClick={handleBulkMarkSafe}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 transition-all">
                    <CheckCircle2 size={11} /> Mark All Safe
                  </button>
                  <button onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/20 transition-all">
                    <Trash2 size={11} /> Delete All
                  </button>
                  <button onClick={() => setSelectedMod(new Set())} className="p-1.5 text-slate-500 hover:text-slate-300 transition-all"><X size={12} /></button>
                </div>
              </div>
            )}

            {modLoading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
                <p className="text-slate-500 text-sm">Scanning…</p>
              </div>
            ) : riskyFiles.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><CheckCircle2 size={24} /></div>
                <div className="text-center">
                  <p className="text-white font-semibold text-sm">Platform is Clean</p>
                  <p className="text-slate-500 text-xs mt-1">No flagged content.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {/* Select all */}
                <div className="px-4 sm:px-6 py-2 flex items-center gap-2 bg-slate-900/30">
                  <input type="checkbox"
                    checked={selectedMod.size === riskyFiles.length}
                    onChange={e => setSelectedMod(e.target.checked ? new Set(riskyFiles.map(f => f.fileId)) : new Set())}
                    className="rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Select all</span>
                </div>
                {riskyFiles.map(file => (
                  <div key={file.fileId} className={`px-4 sm:px-6 py-4 hover:bg-white/[0.02] transition-colors ${selectedMod.has(file.fileId) ? 'bg-rose-500/[0.03]' : ''}`}>
                    <div className="flex items-start gap-3">
                      <input type="checkbox" checked={selectedMod.has(file.fileId)}
                        onChange={e => {
                          const n = new Set(selectedMod);
                          e.target.checked ? n.add(file.fileId) : n.delete(file.fileId);
                          setSelectedMod(n);
                        }}
                        className="mt-1 rounded border-white/20 bg-slate-800 text-rose-500 focus:ring-0 focus:ring-offset-0 shrink-0"
                      />
                      <ExtBadge filename={file.filename} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200 truncate">{file.filename}</p>
                        <p className="text-[10px] text-slate-600 font-mono mt-0.5">{file.userId.slice(0, 14)}…</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(file.moderationLabels || []).map((l, i) => {
                            const conf = Math.round(l.confidence);
                            const severity = conf >= 90 ? 'bg-rose-600/20 text-rose-300 border-rose-500/30' : conf >= 70 ? 'bg-orange-500/15 text-orange-400 border-orange-500/25' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                            return (
                              <span key={i} className={`px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase ${severity}`}>
                                {l.name} <span className="opacity-70">{conf}%</span>
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="inline-flex items-center gap-1 text-amber-400 text-[10px] font-bold uppercase">
                            <Filter size={9} /> Pending Review
                          </span>
                          <span className="text-slate-700 text-[10px]">·</span>
                          <span className="text-[10px] text-slate-600">{formatBytes(file.size)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button onClick={() => handlePreview(file)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-700/40 hover:bg-slate-700/60 text-slate-300 border border-white/10 transition-all">
                          <Eye size={11} /> View
                        </button>
                        <button onClick={() => handleMarkSafe(file.userId, file.fileId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 transition-all">
                          <CheckCircle2 size={11} /> Safe
                        </button>
                        <button onClick={() => handleModerationDelete(file)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/20 transition-all">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>

    {previewModal && <PreviewModal file={previewModal.file} url={previewModal.url} onClose={() => setPreviewModal(null)} />}
    {notifyUser && <NotifyModal user={notifyUser} token={token} onClose={() => setNotifyUser(null)} />}
    {limitsUser && <LimitsModal user={limitsUser} token={token} onClose={() => setLimitsUser(null)} onSaved={updated => setUsers(prev => prev.map(u => u.userId === updated.userId ? updated : u))} />}
    </>
  );
};

export default AdminPage;
