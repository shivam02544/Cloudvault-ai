import { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export const useVault = () => {
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState({ storageUsed: 0, maxStorage: 5 * 1024 * 1024 * 1024 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  
  // UI States
  const [viewMode, setViewMode] = useState('grid');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [shareFile, setShareFile] = useState(null);

  const { addToast } = useToast();
  const { token } = useAuth();

  // Search Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Initial Fetch
  const fetchVault = async () => {
    if (!token) return;
    setLoading(true);
    setLoadError(false);
    try {
      const [filesRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/files`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/files/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setFiles(filesRes.data?.files || []);
      setStats(statsRes.data || { storageUsed: 0, maxStorage: 5 * 1024 * 1024 * 1024 });
    } catch (err) {
      console.error('Fetch Vault Error:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVault();
  }, [token]);

  const handleCopyUrl = async (fileId) => {
    try {
      const res = await axios.get(`${API_URL}/files/${fileId}/url`, { headers: { Authorization: `Bearer ${token}` } });
      await navigator.clipboard.writeText(res.data.url);
      addToast('Link copied to clipboard', 'success');
    } catch { 
      addToast('Failed to copy link', 'error'); 
    }
  };

  const handlePreview = async (file) => {
    try {
      const res = await axios.get(`${API_URL}/files/${file.fileId}/url`, { headers: { Authorization: `Bearer ${token}` } });
      setPreviewData({ file, url: res.data.url });
    } catch { 
      addToast('Failed to load preview', 'error'); 
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(`${API_URL}/files/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(prev => prev.filter(f => f.fileId !== fileId));
      addToast('File deleted', 'success');
    } catch { 
      addToast('Failed to delete file', 'error'); 
    }
  };

  const handleUploadSuccess = (fileData) => {
    setFiles(prev => [{
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
    }, ...prev]);
    setStats(prev => ({ ...prev, storageUsed: prev.storageUsed + (fileData.size || 0) }));
  };

  const handleUpdateFile = (updated) => {
    setFiles(prev => prev.map(f => f.fileId === updated.fileId ? updated : f));
  };

  const handleResetVault = async () => {
    try {
      await axios.post(`${API_URL}/files/reset`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setFiles([]);
      setStats(prev => ({ ...prev, storageUsed: 0, fileCount: 0 }));
      addToast('Vault reset successfully', 'success');
      return true;
    } catch (err) {
      addToast('Failed to reset vault', 'error');
      console.error('Reset Vault Error:', err);
      return false;
    }
  };

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

  return {
    files: filteredFiles,
    totalFiles: files.length,
    stats,
    loading,
    loadError,
    viewMode, setViewMode,
    activeCategory, setActiveCategory,
    searchTerm, setSearchTerm,
    previewData, setPreviewData,
    shareFile, setShareFile,
    usagePercent,
    actions: {
      handleCopyUrl,
      handlePreview,
      handleDelete,
      handleUploadSuccess,
      handleUpdateFile,
      handleResetVault,
      fetchVault
    }
  };
};
