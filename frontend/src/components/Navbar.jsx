import { Cloud, ShieldCheck, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-white/[0.05] bg-[#05080f]/60 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 group"
          >
            <div className="relative h-9 w-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <Cloud className="h-5 w-5 text-white" />
              <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-sm font-black tracking-tighter text-white uppercase italic">
                CloudVault
              </span>
              <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">
                AI Intelligence
              </span>
            </div>
          </motion.button>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                onClick={() => navigate(isAdminPage ? '/' : '/admin')}
                className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${
                  isAdminPage
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                {isAdminPage ? 'Dashboard' : 'Admin Console'}
              </motion.button>
            )}

            <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                onClick={logout}
                title="Sign out"
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-200 px-3 py-2 rounded-xl transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/profile')}
                title="Account Settings"
                className="h-9 w-9 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5 shadow-xl hover:border-blue-500/30 hover:bg-blue-500/10 transition-all group"
              >
                <User className="h-4 w-4 text-slate-400 group-hover:text-blue-400" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle bottom highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
    </nav>
  );
};

export default Navbar;

