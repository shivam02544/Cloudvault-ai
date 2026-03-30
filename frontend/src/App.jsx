import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadDropzone from './components/UploadDropzone';
import PreviewModal from './components/PreviewModal';
import ShareModal from './components/ShareModal';
import NSFWBlur from './components/NSFWBlur';

import {
  HardDrive, FilePlus, FolderOpen,
  LayoutGrid, List as ListIcon, Image, FileText, File, Loader2, Eye, Copy, Trash2,
  Video, Music, Archive, Search, Info, Share2, ShieldCheck
} from 'lucide-react';
import { useToast } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL) {
  console.warn("VITE_API_URL is missing. API calls will fail.");
}

// Render an icon based on MIME type
const FileIcon = ({ type, className }) => {
  if (type?.startsWith('image/')) return <Image className={className} />;
  if (type?.startsWith('video/')) return <Video className={className} />;
  if (type?.startsWith('audio/')) return <Music className={className} />;
  if (type === 'application/pdf' || type?.startsWith('text/')) return <FileText className={className} />;
  if (type?.includes('zip') || type?.includes('rar') || type?.includes('tar')) return <Archive className={className} />;
  return <File className={className} />;
};

// Format bytes to human-readable string
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const { token, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleCopyUrl = async (fileId) => {
    try {
      const res = await axios.get(`${API_URL}/files/${fileId}/url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await navigator.clipboard.writeText(res.data.url);
      addToast('Link copied to clipboard', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to copy link', 'error');
    }
  };

  const handlePreview = async (file) => {
    try {
      const res = await axios.get(`${API_URL}/files/${file.fileId}/url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreviewData({ file, url: res.data.url });
    } catch (err) {
      console.error(err);
      addToast('Failed to load preview', 'error');
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
      addToast('File deleted', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to delete file', 'error');
    }
  };

  // Fetch files from DynamoDB via GET /files — once on mount only (DECISIONS.md Phase 3)
  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [filesRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/files`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/files/stats`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setFiles(filesRes.data.files || []);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Debounce search term to prevent excessive filtering logic on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Optimistic update: add newly uploaded file immediately to local state
  const handleUploadSuccess = (fileData) => {
    const newFile = {
      fileId: fileData.fileId,
      filename: fileData.name || 'Untitled',
      key: fileData.key,
      contentType: fileData.contentType,
      size: fileData.size || 0,
      uploadedAt: new Date().toISOString(),
      status: 'active',
      tags: [],
      analyzed: false,
      moderationStatus: 'SAFE',
    };

    setFiles((prev) => [newFile, ...prev]);
    // Also update stats optimistically
    setStats((prev) => ({
      ...prev,
      storageUsed: prev.storageUsed + (fileData.size || 0),
    }));
  };

  const handleUpdateFile = (updatedFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.fileId === updatedFile.fileId ? updatedFile : f))
    );
  };

  const filteredFiles = files.filter((f) => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    const matchesName = (f.filename || "").toLowerCase().includes(searchLower);
    const matchesTags = (f.tags || []).some(tag => (tag || "").toLowerCase().includes(searchLower));

    
    if (!matchesName && !matchesTags) return false;

    if (activeCategory === 'Images') return f.contentType?.startsWith('image/');
    if (activeCategory === 'Video') return f.contentType?.startsWith('video/');
    if (activeCategory === 'Audio') return f.contentType?.startsWith('audio/');
    if (activeCategory === 'Docs') return f.contentType === 'application/pdf' || f.contentType?.startsWith('text/');
    if (activeCategory === 'Archives') return f.contentType?.includes('zip') || f.contentType?.includes('rar') || f.contentType?.includes('tar');
    
    return true;
  });

  const usagePercent = Math.min((stats.storageUsed / stats.maxStorage) * 100, 100);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-animated">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
              My Vault
              {isAdmin && (
                <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  Admin
                </span>
              )}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-500 flex items-center gap-1.5 text-sm">
                <HardDrive className="h-3.5 w-3.5" />
                Storage Limit: 5GB
              </p>
              <div className="hidden sm:flex items-center gap-2 w-32 md:w-48">
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${usagePercent > 90 ? 'bg-rose-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.max(usagePercent, usagePercent > 0 ? 1 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                  {usagePercent > 0 && usagePercent < 0.1 ? '< 0.1%' : `${usagePercent.toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 glass rounded-xl">
            <button
              id="view-grid"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              id="view-list"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mb-12">
          <UploadDropzone onUploadSuccess={handleUploadSuccess} token={token} />
        </div>

        {/* Search & Categories Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div className="relative group max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-slate-800/80 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/5'
                    : 'text-slate-500 border border-slate-700/60 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
            <FilePlus className="h-4 w-4 text-purple-400" />
            Recent Files
          </h2>
          <div className="flex items-center gap-3">
             <span className="text-xs text-slate-500 font-medium">
              {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {/* File List Area */}
        {loading ? (
          /* Loading state — spinner while GET /files is in-flight */
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium animate-pulse">Syncing your vault...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800 animate-in fade-in duration-500">
             <div className="h-16 w-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-600 mb-4">
                <Search className="h-8 w-8" />
             </div>
             <h3 className="text-slate-200 font-semibold text-lg uppercase tracking-wider">No files found</h3>
             <p className="text-slate-500 text-sm max-w-[280px] text-center mt-1">
               {debouncedSearchTerm 
                 ? `We couldn't find anything matching "${debouncedSearchTerm}"`
                 : "This category is currently empty. Upload a file to get started."}
             </p>
             {debouncedSearchTerm && (
               <button 
                 onClick={() => setSearchTerm('')}
                 className="mt-6 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
               >
                 Clear search query
               </button>
             )}
          </div>
        ) : (
          /* File grid or list */
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
                : 'space-y-2.5'
            }
          >
            {filteredFiles.map((file) => (
              <div
                key={file.fileId}
                className={`glass group relative transition-all duration-200 hover:glow-blue ${
                  viewMode === 'grid'
                    ? 'p-5 flex flex-col cursor-default'
                    : 'px-5 py-3.5 flex items-center gap-4 cursor-default'
                }`}
              >
                {/* File icon */}
                <NSFWBlur moderationStatus={file.moderationStatus} className={viewMode === 'grid' ? 'mb-4' : 'shrink-0'}>
                  <div
                    className={`flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 shrink-0 ${
                      viewMode === 'grid' ? 'h-11 w-11' : 'h-9 w-9'
                    }`}
                  >
                    <FileIcon
                      type={file.contentType}
                      className={viewMode === 'grid' ? 'h-5 w-5' : 'h-4 w-4'}
                    />
                  </div>
                </NSFWBlur>

                {/* File metadata */}
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-sm font-medium text-slate-200 truncate"
                    title={file.filename}
                  >
                    {file.filename}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-[10px] text-slate-600 font-medium">
                      {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {/* Tag Badges (Phase 10 Wave 3) */}
                    <div className="flex gap-1 overflow-hidden">
                        {(file.tags || []).slice(0, 2).map((tag, i) => (
                           <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium truncate max-w-[60px]">
                             {tag}
                           </span>
                        ))}
                        {file.tags?.length > 2 && (
                           <span className="text-[9px] px-1 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 font-medium">
                             +{file.tags.length - 2}
                           </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* List-mode file size */}
                {viewMode === 'list' && (
                  <span className="text-xs text-slate-600 shrink-0 font-mono">
                    {formatSize(file.size)}
                  </span>
                )}

                {/* Hover actions overlay */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handlePreview(file)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shadow-lg"
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleCopyUrl(file.fileId)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors shadow-lg"
                    title="Copy Link (Internal)"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShareFile(file)}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/10"
                    title="Share File (Public)"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.fileId)}
                    className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg transition-colors shadow-lg"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal Overlay (Phase 7 Wave 4) */}
      {previewData && (
        <PreviewModal 
          file={previewData.file}
          url={previewData.url}
          token={token}
          onUpdate={handleUpdateFile}
          onClose={() => setPreviewData(null)}
        />
      )}
      {/* Share Modal (Phase 7 Wave 5) */}
      {shareFile && (
        <ShareModal 
          file={shareFile}
          onClose={() => setShareFile(null)}
          onUpdate={handleUpdateFile}
          token={token}
        />
      )}
    </div>
  );
}

export default App;
