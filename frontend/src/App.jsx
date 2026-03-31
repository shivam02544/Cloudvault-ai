import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadDropzone from './components/UploadDropzone';
import PreviewModal from './components/PreviewModal';
import ShareModal from './components/ShareModal';
import NSFWBlur from './components/NSFWBlur';
import {
  HardDrive, LayoutGrid, List as ListIcon,
  Image, FileText, File, Loader2, Eye, Copy, Trash2,
  Video, Music, Archive, Search, Share2, ShieldCheck, FolderOpen
} from 'lucide-react';
import { useToast } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const FileIcon = ({ type, className }) => {
  if (type?.startsWith('image/')) return <Image className={className} />;
  if (type?.startsWith('video/')) return <Video className={className} />;
  if (type?.startsWith('audio/')) return <Music className={className} />;
  if (type === 'application/pdf' || type?.startsWith('text/')) return <FileText className={className} />;
  if (type?.includes('zip') || type?.includes('rar') || type?.includes('tar')) return <Archive className={className} />;
  return <File className={className} />;
};

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const CATEGORIES = ['All', 'Images', 'Video', 'Audio', 'Docs', 'Archives'];

function App() {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ storageUsed: 0, maxStorage: 5 * 1024 * 1024 * 1024 });
  const [viewMode, setViewMode] = useState('grid');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { addToast } = useToast();
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    Promise.allSettled([
      axios.get(`${API_URL}/files`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_URL}/files/stats`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([filesResult, statsResult]) => {
      if (filesResult.status === 'fulfilled') setFiles(filesResult.value.data?.files || []);
      if (statsResult.status === 'fulfilled') setStats(statsResult.value.data || { storageUsed: 0, maxStorage: 5 * 1024 * 1024 * 1024 });
      if (filesResult.status === 'rejected' && statsResult.status === 'rejected') setLoadError(true);
    }).finally(() => setLoading(false));
  }, []);

  const handleCopyUrl = async (fileId) => {
    try {
      const res = await axios.get(`${API_URL}/files/${fileId}/url`, { headers: { Authorization: `Bearer ${token}` } });
      await navigator.clipboard.writeText(res.data.url);
      addToast('Link copied to clipboard', 'success');
    } catch { addToast('Failed to copy link', 'error'); }
  };

  const handlePreview = async (file) => {
    try {
      const res = await axios.get(`${API_URL}/files/${file.fileId}/url`, { headers: { Authorization: `Bearer ${token}` } });
      setPreviewData({ file, url: res.data.url });
    } catch { addToast('Failed to load preview', 'error'); }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`${API_URL}/files/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(prev => prev.filter(f => f.fileId !== fileId));
      addToast('File deleted', 'success');
    } catch { addToast('Failed to delete file', 'error'); }
  };

  const handleUploadSuccess = (fileData) => {
    setFiles(prev => [{
      fileId: fileData.fileId, filename: fileData.name || 'Untitled',
      key: fileData.key, contentType: fileData.contentType, size: fileData.size || 0,
      uploadedAt: new Date().toISOString(), status: 'active',
      tags: [], analyzed: false, moderationStatus: 'SAFE',
    }, ...prev]);
    setStats(prev => ({ ...prev, storageUsed: prev.storageUsed + (fileData.size || 0) }));
  };

  const handleUpdateFile = (updated) => setFiles(prev => prev.map(f => f.fileId === updated.fileId ? updated : f));

  const filteredFiles = files.filter(f => {
    const q = debouncedSearch.toLowerCase();
    const match = (f.filename || '').toLowerCase().includes(q) || (f.tags || []).some(t => t.toLowerCase().includes(q));
    if (!match) return false;
    if (activeCategory === 'Images') return f.contentType?.startsWith('image/');
    if (activeCategory === 'Video') return f.contentType?.startsWith('video/');
    if (activeCategory === 'Audio') return f.contentType?.startsWith('audio/');
    if (activeCategory === 'Docs') return f.contentType === 'application/pdf' || f.contentType?.startsWith('text/');
    if (activeCategory === 'Archives') return f.contentType?.includes('zip') || f.contentType?.includes('rar') || f.contentType?.includes('tar');
    return true;
  });

  const usagePercent = stats
    ? Math.min(((stats.storageUsed || 0) / (stats.maxStorage || 5 * 1024 * 1024 * 1024)) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-animated">
      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              My Vault
              {isAdmin && (
                <button onClick={() => navigate('/admin')}
                  className="flex items-center gap-1 text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest hover:bg-blue-500/25 transition-all">
                  <ShieldCheck size={9} /> Admin
                </button>
              )}
            </h1>
            {/* Storage bar */}
            <div className="flex items-center gap-2 mt-1.5">
              <HardDrive className="h-3 w-3 text-slate-600" />
              <div className="h-1 w-20 sm:w-28 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.max(usagePercent, usagePercent > 0 ? 1 : 0)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-600">
                {usagePercent > 0 && usagePercent < 0.1 ? '<0.1%' : `${usagePercent.toFixed(1)}%`} of 5 GB
              </span>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 glass rounded-xl shrink-0">
            {[['grid', LayoutGrid], ['list', ListIcon]].map(([mode, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`p-2 rounded-lg transition-all ${viewMode === mode ? 'bg-blue-500/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                aria-label={`${mode} view`}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Upload ── */}
        <div className="mb-8">
          <UploadDropzone onUploadSuccess={handleUploadSuccess} token={token} />
        </div>

        {/* ── Search ── */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text" placeholder="Search files or tags…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/40 border border-white/[0.07] focus:border-blue-500/40 focus:bg-slate-800/70 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all"
          />
        </div>

        {/* ── Category filters ── */}
        <div className="flex items-center gap-1.5 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/35'
                  : 'text-slate-500 border border-white/[0.07] hover:border-white/20 hover:text-slate-300'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* ── Section header ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-widest">
            <FolderOpen className="h-3.5 w-3.5 text-purple-400" /> Recent Files
          </h2>
          <span className="text-xs text-slate-600">{filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}</span>
        </div>

        {/* ── File list ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-sm">Syncing your vault…</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-rose-500/20 bg-rose-500/5">
            <p className="text-rose-400 font-semibold text-sm">Failed to load files</p>
            <p className="text-slate-600 text-xs mt-1">Check your connection and try refreshing.</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-blue-400 hover:text-blue-300 text-xs transition-colors">
              Refresh page
            </button>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-white/[0.07] bg-white/[0.01]">
            <div className="h-12 w-12 bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-600 mb-3">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-slate-300 font-semibold text-sm">No files found</p>
            <p className="text-slate-600 text-xs mt-1 max-w-[220px] text-center">
              {debouncedSearch ? `Nothing matching "${debouncedSearch}"` : 'Upload a file to get started.'}
            </p>
            {debouncedSearch && (
              <button onClick={() => setSearchTerm('')} className="mt-3 text-blue-400 hover:text-blue-300 text-xs transition-colors">
                Clear search
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredFiles.map(file => (
              <div key={file.fileId} className="glass flex flex-col transition-all duration-200 hover:glow-blue overflow-hidden rounded-2xl">
                {/* Info area — tapping opens preview */}
                <button onClick={() => handlePreview(file)} className="flex items-center gap-3 p-4 text-left w-full active:bg-white/[0.04] transition-colors">
                  <NSFWBlur moderationStatus={file.moderationStatus}>
                    <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                      <FileIcon type={file.contentType} className="h-5 w-5" />
                    </div>
                  </NSFWBlur>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate leading-snug" title={file.filename}>{file.filename}</p>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="text-[10px] text-slate-600">
                        {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-700">·</span>
                      <span className="text-[10px] text-slate-600">{formatSize(file.size)}</span>
                      {(file.tags || []).slice(0, 1).map((tag, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-medium truncate max-w-[50px]">{tag}</span>
                      ))}
                      {(file.tags || []).length > 1 && (
                        <span className="text-[9px] text-slate-600">+{file.tags.length - 1}</span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Action bar — always visible, touch-friendly */}
                <div className="flex items-center border-t border-white/[0.05] divide-x divide-white/[0.05]">
                  <button onClick={() => handlePreview(file)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-slate-500 active:bg-blue-500/10 hover:text-blue-400 hover:bg-blue-500/5 transition-all text-[11px] font-medium">
                    <Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline ml-1">View</span>
                  </button>
                  <button onClick={() => handleCopyUrl(file.fileId)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-slate-500 active:bg-white/10 hover:text-slate-200 hover:bg-white/5 transition-all text-[11px] font-medium">
                    <Copy className="h-3.5 w-3.5" /><span className="hidden sm:inline ml-1">Copy</span>
                  </button>
                  <button onClick={() => setShareFile(file)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-slate-500 active:bg-blue-500/10 hover:text-blue-400 hover:bg-blue-500/5 transition-all text-[11px] font-medium">
                    <Share2 className="h-3.5 w-3.5" /><span className="hidden sm:inline ml-1">Share</span>
                  </button>
                  <button onClick={() => handleDelete(file.fileId)}
                    className="flex-1 flex items-center justify-center gap-1 py-3 text-slate-500 active:bg-rose-500/10 hover:text-rose-400 hover:bg-rose-500/5 transition-all text-[11px] font-medium">
                    <Trash2 className="h-3.5 w-3.5" /><span className="hidden sm:inline ml-1">Del</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── List view ── */
          <div className="space-y-2">
            {filteredFiles.map(file => (
              <div key={file.fileId} className="glass rounded-2xl overflow-hidden transition-all duration-200 hover:glow-blue">
                <div className="flex items-center gap-3 px-4 py-3">
                  <NSFWBlur moderationStatus={file.moderationStatus} className="shrink-0">
                    <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
                      <FileIcon type={file.contentType} className="h-4 w-4" />
                    </div>
                  </NSFWBlur>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate" title={file.filename}>{file.filename}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-600">
                        {new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-slate-700 hidden sm:inline">·</span>
                      <span className="text-[10px] text-slate-600 hidden sm:inline">{formatSize(file.size)}</span>
                      {(file.tags || []).slice(0, 2).map((tag, i) => (
                        <span key={i} className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 font-medium truncate max-w-[56px]">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <span className="text-xs text-slate-600 shrink-0 font-mono sm:hidden">{formatSize(file.size)}</span>

                  {/* Inline actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => handlePreview(file)} title="Preview"
                      className="p-2.5 text-slate-500 hover:text-blue-400 active:bg-blue-500/10 hover:bg-blue-500/10 rounded-xl transition-all">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleCopyUrl(file.fileId)} title="Copy link"
                      className="p-2.5 text-slate-500 hover:text-slate-200 active:bg-white/5 hover:bg-white/5 rounded-xl transition-all">
                      <Copy className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShareFile(file)} title="Share"
                      className="p-2.5 text-slate-500 hover:text-blue-400 active:bg-blue-500/10 hover:bg-blue-500/10 rounded-xl transition-all">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(file.fileId)} title="Delete"
                      className="p-2.5 text-slate-500 hover:text-rose-400 active:bg-rose-500/10 hover:bg-rose-500/10 rounded-xl transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {previewData && (
        <PreviewModal file={previewData.file} url={previewData.url} token={token} onUpdate={handleUpdateFile} onClose={() => setPreviewData(null)} />
      )}
      {shareFile && (
        <ShareModal file={shareFile} onClose={() => setShareFile(null)} onUpdate={handleUpdateFile} token={token} />
      )}
    </div>
  );
}

export default App;
