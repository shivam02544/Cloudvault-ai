import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Clock, XCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Shown when account is pending admin approval
export function PendingScreen({ onLogout }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] px-6 relative overflow-hidden">
      {/* Background Layer (Static) */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-40" />
         <div className="absolute inset-0 bg-grid-mesh opacity-20" />
      </div>

      <div className="glass-premium p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] max-w-md w-full border border-white/[0.05] text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 blur-[60px] rounded-full" />
        
        <div className="h-16 w-16 sm:h-20 sm:w-20 bg-amber-500/10 rounded-2xl sm:rounded-3xl flex items-center justify-center text-amber-400 mx-auto mb-6 sm:mb-8 border border-amber-500/20 shadow-lg">
          <Clock size={32} className="sm:size-[40px] animate-pulse" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter mb-4">Awaiting Approval</h2>
        
        <p className="text-[13px] sm:text-sm text-slate-400 leading-relaxed font-medium mb-8">
          Your account is pending review. You'll be able to access your vault once approved.
          This usually takes less than 24 hours.
        </p>

        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-8 text-left relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 opacity-40" />
          <p className="text-[10px] sm:text-[11px] text-blue-400 font-black uppercase tracking-widest leading-relaxed">
            An admin will review your registration. Once approved, you'll have full access to CloudVault.
          </p>
        </div>

        <button 
          onClick={onLogout} 
          className="w-full py-4 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 hover:bg-white/10 text-slate-500 border border-white/10 transition-all active:scale-[0.98]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// Shown when account was denied
export function DeniedScreen({ onLogout }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] px-6 relative overflow-hidden">
      {/* Background Layer (Static) */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-40" />
         <div className="absolute inset-0 bg-grid-mesh opacity-20" />
      </div>

      <div className="glass-premium p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] max-w-md w-full border border-rose-500/10 text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/5 blur-[60px] rounded-full" />
        
        <div className="h-16 w-16 sm:h-20 sm:w-20 bg-rose-500/10 rounded-2xl sm:rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6 sm:mb-8 border border-rose-500/20 shadow-lg">
          <XCircle size={32} className="sm:size-[40px]" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-rose-100 italic uppercase tracking-tighter mb-4">Account Denied</h2>
        
        <p className="text-[13px] sm:text-sm text-slate-400 leading-relaxed font-medium mb-8">
          Your account registration was not approved. If you believe this is a mistake, please contact support.
        </p>

        <button 
          onClick={onLogout} 
          className="w-full py-4 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 hover:bg-white/10 text-slate-500 border border-white/10 transition-all active:scale-[0.98]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { token, loading, logout, status } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] relative overflow-hidden px-6">
        {/* Background Layer (Static) */}
        <div className="fixed inset-0 pointer-events-none -z-10">
           <div className="absolute inset-0 bg-aurora opacity-30" />
           <div className="absolute inset-0 bg-grid-mesh opacity-10" />
        </div>
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-700">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] italic animate-pulse text-center">Synchronizing Secure Connection...</p>
        </div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  if (status === 'pending') return <PendingScreen onLogout={logout} />;
  if (status === 'denied') return <DeniedScreen onLogout={logout} />;

  return children;
}
