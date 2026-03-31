import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Clock, XCircle, Cloud } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Shown when account is pending admin approval
function PendingScreen({ onLogout }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-animated px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-600/5 blur-[80px]" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">CloudVault AI</span>
        </div>
        <div className="glass p-7 rounded-2xl shadow-2xl shadow-black/30 text-center">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-5 border border-amber-500/20">
            <Clock className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-white mb-2">Awaiting Approval</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-5">
            Your account is pending admin review. You'll be able to access your vault once approved.
            This usually takes less than 24 hours.
          </p>
          <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3 mb-5 text-left">
            <p className="text-xs text-blue-400/80 leading-relaxed">
              An admin will review your registration and you'll receive a notification when a decision is made.
            </p>
          </div>
          <button onClick={onLogout} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 transition-all">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// Shown when account was denied
function DeniedScreen({ onLogout }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-animated px-4">
      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">CloudVault AI</span>
        </div>
        <div className="glass p-7 rounded-2xl shadow-2xl shadow-black/30 text-center">
          <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 mx-auto mb-5 border border-rose-500/20">
            <XCircle className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-white mb-2">Account Not Approved</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-5">
            Your account registration was not approved. If you believe this is a mistake, please contact support.
          </p>
          <button onClick={onLogout} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 transition-all">
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { token, loading, logout, isAdmin } = useAuth();
  const [accountStatus, setAccountStatus] = useState(null); // null = loading
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    // Admins bypass the approval check
    if (isAdmin) { setAccountStatus('active'); return; }

    setStatusLoading(true);
    axios.get(`${API_URL}/auth/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setAccountStatus(r.data.status || 'active'))
      .catch(() => setAccountStatus('active')) // fail-open: don't block on network error
      .finally(() => setStatusLoading(false));
  }, [token, isAdmin]);

  if (loading || (token && statusLoading && accountStatus === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-animated">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  if (accountStatus === 'pending') return <PendingScreen onLogout={logout} />;
  if (accountStatus === 'denied') return <DeniedScreen onLogout={logout} />;

  return children;
}
