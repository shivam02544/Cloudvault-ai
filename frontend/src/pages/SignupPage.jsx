import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Cloud, UserPlus, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import OTPInput from '../components/OTPInput';

export default function SignupPage() {
  const { signup, confirmSignup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(!!searchParams.get('email'));
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signup(email, password); setIsVerifying(true); }
    catch (err) { setError(err.message || 'Signup failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await confirmSignup(email, code); setSuccess(true); setTimeout(() => navigate('/login'), 3000); }
    catch (err) { setError(err.message || 'Verification failed. Please check your code.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-animated px-4" id="signup-page">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-600/5 blur-[80px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600/5 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Cloud className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            CloudVault AI
          </span>
        </div>

        <div className="glass p-7 rounded-2xl shadow-2xl shadow-black/30">
          {success ? (
            <div className="text-center py-4">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-4 border border-emerald-500/20">
                <CheckCircle className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">Account Verified!</h2>
              <p className="text-sm text-slate-500 mb-5">Redirecting you to login…</p>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors w-full">
                Go to Login
              </Link>
            </div>
          ) : isVerifying ? (
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
              <button onClick={() => setIsVerifying(false)} className="w-full text-center text-xs text-slate-600 mt-5 hover:text-slate-400 transition-colors">
                ← Back to Signup
              </button>
            </>
          ) : (
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
