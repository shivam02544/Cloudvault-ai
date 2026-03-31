import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Clock, XCircle, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Shown when account is pending admin approval
export function PendingScreen({ onLogout }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] px-4 relative overflow-hidden">
      {/* Neural Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-40" />
         <div className="absolute inset-0 bg-grid-mesh opacity-30" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-auth p-10 rounded-[2.5rem] max-w-md w-full border border-white/[0.05] text-center relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 blur-[60px] rounded-full" />
        
        <div className="h-20 w-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-400 mx-auto mb-8 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
          <Clock size={40} className="animate-pulse" />
        </div>

        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">Awaiting Approval</h2>
        
        <p className="text-sm text-slate-400 leading-relaxed font-medium mb-8">
          Your account is pending admin review. You'll be able to access your vault once approved.
          This usually takes less than 24 hours.
        </p>

        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 mb-8 text-left relative overflow-hidden group">
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 opacity-40" />
          <p className="text-[11px] text-blue-400/80 font-black uppercase tracking-widest leading-relaxed">
            An admin will review your registration and you'll receive a notification when a decision is made.
          </p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout} 
          className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 hover:bg-white/10 text-slate-500 border border-white/5 transition-all"
        >
          Sign out
        </motion.button>
      </motion.div>
    </div>
  );
}

// Shown when account was denied
export function DeniedScreen({ onLogout }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] px-4 relative overflow-hidden">
      {/* Neural Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-40" />
         <div className="absolute inset-0 bg-grid-mesh opacity-30" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-auth p-10 rounded-[2.5rem] max-w-md w-full border border-rose-500/10 text-center relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/5 blur-[60px] rounded-full" />
        
        <div className="h-20 w-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
          <XCircle size={40} />
        </div>

        <h2 className="text-xl font-black text-rose-100 italic uppercase tracking-tighter mb-4">Access Terminated</h2>
        
        <p className="text-sm text-slate-400 leading-relaxed font-medium mb-8">
          Your account registration was not approved. If you believe this is a mistake, please contact support.
        </p>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout} 
          className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 hover:bg-white/10 text-slate-500 border border-white/5 transition-all"
        >
          Sign out
        </motion.button>
      </motion.div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { token, loading, logout, status } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] relative overflow-hidden">
        {/* Neural Background Layer */}
        <div className="fixed inset-0 pointer-events-none -z-10">
           <div className="absolute inset-0 bg-aurora opacity-30" />
           <div className="absolute inset-0 bg-grid-mesh opacity-20" />
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] italic animate-pulse">Neural Synchronization In Progress</p>
        </motion.div>
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;

  if (status === 'pending') return <PendingScreen onLogout={logout} />;
  if (status === 'denied') return <DeniedScreen onLogout={logout} />;

  return children;
}
