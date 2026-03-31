import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { UserPlus, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Clock, XCircle, ShieldPlus, Zap } from 'lucide-react';
import OTPInput from '../components/OTPInput';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function SignupPage() {
  const { signup, confirmSignup, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(searchParams.get('email') ? 'verifying' : 'form');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await signup(email, password);
      setStage('verifying');
    } catch (err) { setError(err.message || 'Signup failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await confirmSignup(email, code);
      const session = await login(email, password);
      const idToken = session.getIdToken().getJwtToken();

      let status = 'pending';
      try {
        const res = await axios.post(`${API_URL}/auth/register`, {}, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        status = res.data.status || 'pending';
      } catch (regErr) {
        console.warn('Register call failed, defaulting to pending:', regErr.message);
      }

      if (status === 'active') {
        navigate('/');
      } else if (status === 'denied') {
        setStage('denied');
      } else {
        setStage('pending');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Verification failed. Please check your code.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] px-6 relative overflow-hidden" id="signup-page">
      
      {/* Background Layer (Static) */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-40" />
         <div className="absolute inset-0 bg-grid-mesh opacity-20" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Branding */}
        <div className="flex items-center justify-center gap-4 mb-10 sm:mb-12">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 -rotate-3 transition-transform duration-500">
            <ShieldPlus size={20} className="text-white sm:size-[24px]" />
          </div>
          <span className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white">
            CloudVault <span className="text-blue-500 not-italic font-bold text-[10px] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 tracking-widest ml-1">AI</span>
          </span>
        </div>

        <div className="glass-auth p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden border border-white/[0.05]">
          {/* ── Pending approval ── */}
          {stage === 'pending' && (
            <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-amber-500/10 rounded-3xl flex items-center justify-center text-amber-400 mx-auto mb-8 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
                <Clock className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mb-4">Account Under Review</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-8 opacity-70">
                Email verification complete. Awaiting administrative approval for system access.
              </p>
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 sm:p-6 mb-8 text-left">
                <p className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                   <Zap size={10} /> Status: Pending Approval
                </p>
                <p className="text-[9px] sm:text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-tight">
                  Administrators are reviewing your credentials. Access is usually granted within 24 hours.
                </p>
              </div>
              <Link to="/login" className="block w-full text-center py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 transition-all">
                Return to Login
              </Link>
            </div>
          )}

          {/* ── Denied ── */}
          {stage === 'denied' && (
            <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-500">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-400 mx-auto mb-8 border border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.1)]">
                <XCircle className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mb-4">Access Denied</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed mb-8 opacity-70">
                Your account request has been declined by the administrative team.
              </p>
              <Link to="/login" className="block w-full text-center py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 transition-all">
                Return to Login
              </Link>
            </div>
          )}

          {/* ── OTP verification ── */}
          {stage === 'verifying' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                 <Zap size={14} className="text-blue-500 animate-pulse" />
                 <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/80">Verification Required</span>
              </div>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Verify Email</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mb-10 opacity-70">
                Enter the code sent to <span className="text-slate-300 block sm:inline mt-1 sm:mt-0">{email}</span>
              </p>

              {error && (
                <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] uppercase font-bold tracking-wider px-4 py-3 rounded-2xl mb-8">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-8">
                <div className="w-full">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 text-center">Verification Code</label>
                  <div className="w-full max-w-[280px] sm:max-w-none mx-auto">
                    <OTPInput value={code} onChange={setCode} disabled={loading} />
                  </div>
                </div>
                <button id="verify-submit" type="submit" disabled={loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black text-[11px] uppercase tracking-[0.4em] py-5 rounded-2xl transition-all shadow-2xl shadow-blue-900/40 hover:-translate-y-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {loading ? 'Confirming…' : 'Confirm Identity'}
                </button>
              </form>
              <button onClick={() => setStage('form')} className="w-full text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-10 hover:text-blue-500 transition-colors">
                ← Re-enter Email
              </button>
            </div>
          )}

          {/* ── Signup form ── */}
          {stage === 'form' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="flex items-center gap-3 mb-2">
                 <UserPlus size={14} className="text-indigo-400 animate-pulse" />
                 <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400/80">Security Setup</span>
              </div>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Create Account</h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-widest mb-10 opacity-70">Secure your digital assets</p>

              {error && (
                <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] uppercase font-bold tracking-wider px-4 py-3 rounded-2xl mb-8">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-2">Email Address</label>
                  <input id="signup-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="USER@DOMAIN.COM"
                    className="w-full input-auth italic font-bold tracking-tight text-[13px] sm:text-[14px]" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-2">
                    Password <span className="text-slate-700 font-bold lowercase tracking-normal ml-1"> (8+ chars)</span>
                  </label>
                  <div className="relative">
                    <input id="signup-password" type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full input-auth tracking-[0.5em] text-[13px] sm:text-[14px]" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400 transition-colors">
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button id="signup-submit" type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-[11px] uppercase tracking-[0.4em] py-5 rounded-2xl transition-all shadow-2xl shadow-indigo-900/40 mt-4 overflow-hidden relative group hover:-translate-y-1">
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {loading ? 'Initializing…' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-10">
                Already member?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors ml-1">Sign In</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
