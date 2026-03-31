import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL;

export const useAdmin = () => {
  const { token, isAdmin } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersNextToken, setUsersNextToken] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [suspendingId, setSuspendingId] = useState(null);

  // Files State
  const [files, setFiles] = useState([]);
  const [filesNextToken, setFilesNextToken] = useState(null);
  const [filesLoading, setFilesLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Moderation State
  const [riskyFiles, setRiskyFiles] = useState([]);
  const [modLoading, setModLoading] = useState(false);
  const [selectedMod, setSelectedMod] = useState(new Set());

  // Fetch Metrics
  const fetchStats = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
      setStats(r.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin]);

  // Fetch Users
  const fetchUsers = useCallback(async (nextToken = null) => {
    setUsersLoading(true);
    try {
      const url = nextToken ? `${API_URL}/admin/users?nextToken=${encodeURIComponent(nextToken)}` : `${API_URL}/admin/users`;
      const r = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => nextToken ? [...prev, ...r.data.users] : r.data.users);
      setUsersNextToken(r.data.nextToken || null);
    } catch (e) {
      addToast('Failed to load users', 'error');
    } finally {
      setUsersLoading(false);
    }
  }, [token, addToast]);

  // Fetch Files
  const fetchFiles = useCallback(async (nextToken = null) => {
    setFilesLoading(true);
    try {
      const url = nextToken ? `${API_URL}/admin/files?nextToken=${encodeURIComponent(nextToken)}` : `${API_URL}/admin/files`;
      const r = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(prev => nextToken ? [...prev, ...r.data.files] : r.data.files);
      setFilesNextToken(r.data.nextToken || null);
    } catch (e) {
      addToast('Failed to load files', 'error');
    } finally {
      setFilesLoading(false);
    }
  }, [token, addToast]);

  // Fetch Flagged
  const fetchRiskyFiles = useCallback(async () => {
    setModLoading(true);
    try {
      const r = await axios.get(`${API_URL}/admin/moderation/risky`, { headers: { Authorization: `Bearer ${token}` } });
      setRiskyFiles(r.data.files || []);
      setSelectedMod(new Set());
    } catch (e) {
      addToast('Failed to load moderation queue', 'error');
    } finally {
      setModLoading(false);
    }
  }, [token, addToast]);

  // User Actions
  const toggleSuspend = async (user) => {
    const action = user.status === 'suspended' ? 'activate' : 'suspend';
    setSuspendingId(user.userId);
    try {
      await axios.post(`${API_URL}/admin/users/${user.userId}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => u.userId === user.userId ? { ...u, status: action === 'suspend' ? 'suspended' : 'active' } : u));
      addToast(`User ${action === 'suspend' ? 'suspended' : 'activated'}`, 'success');
    } catch (e) {
      addToast('Action failed', 'error');
    } finally {
      setSuspendingId(null);
    }
  };

  const approveUser = async (user, action) => {
    setSuspendingId(user.userId);
    try {
      await axios.post(`${API_URL}/admin/users/${user.userId}/${action}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(prev => prev.map(u => u.userId === user.userId ? { ...u, status: action === 'approve' ? 'active' : 'denied' } : u));
      addToast(`User ${action === 'approve' ? 'approved' : 'denied'}`, 'success');
    } catch (e) {
      addToast('Action failed', 'error');
    } finally {
      setSuspendingId(null);
    }
  };

  // File Actions
  const deleteFile = async (userId, fileId) => {
    setDeletingId(fileId);
    try {
      await axios.delete(`${API_URL}/admin/files/${userId}/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(prev => prev.filter(f => f.fileId !== fileId));
      setRiskyFiles(prev => prev.filter(f => f.fileId !== fileId));
      addToast('File permanently deleted', 'success');
      return true;
    } catch (e) {
      addToast('Deletion failed', 'error');
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  const markSafe = async (targetUserId, fileId) => {
    try {
      await axios.post(`${API_URL}/admin/moderation/mark-safe`, { targetUserId, fileId }, { headers: { Authorization: `Bearer ${token}` } });
      setRiskyFiles(prev => prev.filter(f => f.fileId !== fileId));
      addToast('File marked as safe', 'success');
      return true;
    } catch (e) {
      addToast('Failed to update status', 'error');
      return false;
    }
  };

  const fetchFileUrl = async (userId, fileId) => {
    try {
      const r = await axios.get(`${API_URL}/files/${fileId}/url?targetUserId=${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      return r.data.url;
    } catch {
      addToast('Failed to fetch preview URL', 'error');
      return null;
    }
  };


  // Initial Load
  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin, fetchStats]);

  // Tab Sync
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'users' && users.length === 0) fetchUsers();
    if (activeTab === 'explorer' && files.length === 0) fetchFiles();
    if (activeTab === 'moderation' && riskyFiles.length === 0) fetchRiskyFiles();
  }, [isAdmin, activeTab, users.length, files.length, riskyFiles.length, fetchUsers, fetchFiles, fetchRiskyFiles]);

  return {
    activeTab, setActiveTab,
    stats, loading, error,
    users, usersNextToken, usersLoading, suspendingId,
    files, filesNextToken, filesLoading, deletingId,
    riskyFiles, modLoading, selectedMod, setSelectedMod,
    actions: {
      fetchStats,
      fetchUsers,
      fetchFiles,
      fetchRiskyFiles,
      toggleSuspend,
      approveUser,
      deleteFile,
      markSafe,
      fetchFileUrl
    }
  };
};
