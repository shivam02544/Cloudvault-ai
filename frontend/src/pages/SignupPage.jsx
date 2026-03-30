import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Cloud, UserPlus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function SignupPage() {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-animated px-4" id="signup-page">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Cloud className="h-9 w-9 text-blue-500" />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            CloudVault AI
          </span>
        </div>

        <div className="glass p-8 rounded-2xl">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-100 mb-2">Check your email</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                We've sent a verification link to <span className="text-slate-200 font-medium">{email}</span>.<br />
                Please verify your email to activate your account, then return here to sign in.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors w-full justify-center"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-slate-100 mb-1">Create account</h1>
              <p className="text-sm text-slate-500 mb-6">Start storing files securely</p>

              {error && (
                <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm px-4 py-3 rounded-xl mb-5">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 font-sans">Email</label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 font-sans">
                    Password <span className="text-slate-600 font-normal ml-1">(min 8 chars, mixed case + numbers)</span>
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  id="signup-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm py-2.5 rounded-xl transition-colors mt-2 shadow-lg shadow-blue-900/20"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>

              <p className="text-center text-sm text-slate-600 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
