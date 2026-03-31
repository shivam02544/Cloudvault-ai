import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] px-4 relative overflow-hidden" id="login-page">
      
      {/* Neural Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-50" />
         <div className="absolute inset-0 bg-grid-mesh" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full animate-pulse-slow" />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md"
      >
        {/* Superior Branding */}
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 mb-12">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3 group-hover:rotate-12 transition-transform duration-500">
            <Lock size={24} className="text-white" />
          </div>
          <span className="text-2xl font-black italic uppercase tracking-tighter text-white">
            CloudVault <span className="text-blue-500 not-italic font-bold text-xs bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 tracking-widest ml-1">AI</span>
          </span>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-auth p-10 rounded-[2.5rem] relative overflow-hidden group border border-white/[0.05]">
          {/* Decorative Corner Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full group-hover:bg-blue-500/20 transition-colors duration-1000" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
               <ShieldCheck size={16} className="text-blue-500 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/80">Security Protocol Alpha</span>
            </div>
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Sector Access</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-10 opacity-70">Initialize neural verification</p>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] uppercase font-bold tracking-wider px-4 py-3 rounded-2xl mb-8"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <div>
                    <span>{error}</span>
                    {error.includes('not confirmed') && (
                      <Link to={`/signup?email=${encodeURIComponent(email)}`} className="block mt-2 text-blue-400 hover:text-blue-300 underline underline-offset-4">
                        Verify Sector Identity →
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={itemVariants}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-2">Grid Identity</label>
                <input
                  id="login-email" type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="IDENTITY@PROTOCOL.CORE"
                  className="w-full input-auth italic font-bold tracking-tight"
                />
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-2">Access Key</label>
                <div className="relative">
                  <input
                    id="login-password" type={showPw ? 'text' : 'password'} required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full input-auth tracking-[0.5em]"
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-blue-400 transition-colors">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                id="login-submit" type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-[11px] uppercase tracking-[0.4em] py-5 rounded-2xl transition-all shadow-2xl shadow-blue-900/40 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {loading ? 'Processing…' : 'Access Sector'}
              </motion.button>
            </form>

            <motion.p variants={itemVariants} className="text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-10">
              New Unit?{' '}
              <Link to="/signup" className="text-blue-500 hover:text-blue-400 transition-colors ml-1">Create Identity</Link>
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
