import { Cloud, ShieldCheck, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#080d1a]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
              <Cloud className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              CloudVault AI
            </span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => navigate(isAdminPage ? '/' : '/admin')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                  isAdminPage
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/25 hover:bg-blue-500/25'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {isAdminPage ? 'Dashboard' : 'Console'}
              </button>
            )}

            <div className="w-px h-5 bg-white/10 mx-1" />

            <button
              onClick={logout}
              title="Sign out"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>

            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-lg">
              <User className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
