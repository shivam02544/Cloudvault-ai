import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Cloud, UserPlus, Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Clock, XCircle } from 'lucide-react';
import OTPInput from '../components/OTPInput';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function SignupPage() {
  const { signup, confirmSignup, login, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(!!searchParams.get('email'));
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
      // 1. Confirm OTP with Cognito
      await confirmSignup(email, code);

      // 2. Log in to get a token so we can call /auth/register
      const session = await login(email, password);
      const idToken = session.getIdToken().getJwtToken();

      // 3. Register user in DynamoDB (creates __STATS__ with status: pending)
      // Non-fatal: if this fails, show pending screen anyway and let user retry
      let status = 'pending';
      try {
        const res = await axios.post(`${API_URL}/auth/register`, {}, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        status = res.data.status || 'pending';
      } catch (regErr) {
        console.warn('Register call failed, defaulting to pending:', regErr.message);
        // Still show pending — admin can approve manually
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-animated px-4" id="signup-page">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-600/5 blur-[80px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600/5 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            CloudVault AI
          </span>
        </div>

        <div className="glass p-7 rounded-2xl shadow-2xl shadow-black/30">

          {/* ── Pending approval ── */}
          {stage === 'pending' && (
            <div className="text-center py-2">
              <div className="h-16 w-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-5 border border-amber-500/20">
                <Clock className="h-8 w-8" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Account Pending Approval</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                Your email has been verified. Your account is now awaiting admin approval.
                You'll receive a notification once it's reviewed.
              </p>
              <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-4 mb-5 text-left">
                <p className="text-xs text-blue-400/80 leading-relaxed">
                  <span className="font-semibold text-blue-400">What happens next?</span><br />
                  An admin will review your registration. If approved, you'll be able to log in and access your vault. This usually takes less than 24 hours.
                </p>
              </div>
              <Link to="/login" className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all">
                Back to Login
              </Link>
            </div>
          )}

          {/* ── Denied ── */}
          {stage === 'denied' && (
            <div className="text-center py-2">
              <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 mx-auto mb-5 border border-rose-500/20">
                <XCircle className="h-8 w-8" />
              </div>
              <h2 className="text-base font-bold text-white mb-2">Account Not Approved</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-5">
                Your account registration was not approved. If you believe this is a mistake, please contact support.
              </p>
              <Link to="/login" className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all">
                Back to Login
              </Link>
            </div>
          )}

          {/* ── OTP verification ── */}
          {stage === 'verifying' && (
            <>
              <h1 className="text-lg font-bold text-white mb-0.5">Verify Email</h1>
              <p className="text-sm text-slate-500 mb-6">Enter the 6-digit code sent to <span className="text-slate-300">{email}</span></p>

              {error && (
                <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2.5 rounded-xl mb-5">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-3 text-center">Verification Code</label>
                  <OTPInput value={code} onChange={setCode} disabled={loading} />
                </div>
                <button id="verify-submit" type="submit" disabled={loading || code.length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {loading ? 'Verifying…' : 'Verify Account'}
                </button>
              </form>
              <button onClick={() => setStage('form')} className="w-full text-center text-xs text-slate-600 mt-5 hover:text-slate-400 transition-colors">
                ← Back to Signup
              </button>
            </>
          )}

          {/* ── Signup form ── */}
          {stage === 'form' && (
            <>
              <h1 className="text-lg font-bold text-white mb-0.5">Create account</h1>
              <p className="text-sm text-slate-500 mb-6">Start storing files securely</p>

              {error && (
                <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2.5 rounded-xl mb-5">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
                  <input id="signup-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-800/50 border border-white/[0.08] focus:border-blue-500/50 focus:bg-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Password <span className="text-slate-600 font-normal">(8+ chars, mixed case + numbers)</span>
                  </label>
                  <div className="relative">
                    <input id="signup-password" type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-800/50 border border-white/[0.08] focus:border-blue-500/50 focus:bg-slate-800/80 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 transition-all" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button id="signup-submit" type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-900/20 mt-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-xs text-slate-600 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">Sign in</Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
