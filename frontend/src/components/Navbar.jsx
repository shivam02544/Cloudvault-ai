import { Cloud, ShieldCheck, LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useVault } from '../hooks/useVault';
import { useState } from 'react';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const vault = useVault();
  const isAdminPage = location.pathname.startsWith('/admin');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = vault.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="sticky top-0 z-[100] w-full border-b border-white/[0.05] bg-[#05080f]/60 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          
          {/* Logo */}
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 sm:gap-3 group transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
              <Cloud className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              <div className="absolute inset-0 bg-white/20 blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[12px] sm:text-sm font-black tracking-tighter text-white uppercase italic">
                CloudVault
              </span>
              <span className="text-[8px] sm:text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">
                Secure Cloud Storage
              </span>
            </div>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {isAdmin && (
              <button
                onClick={() => navigate(isAdminPage ? '/' : '/admin')}
                className={`flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                  isAdminPage
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                <span className="hidden xs:inline">{isAdminPage ? 'Dashboard' : 'Admin Portal'}</span>
                <span className="xs:hidden">{isAdminPage ? 'Dash' : 'Admin'}</span>
              </button>
            )}

            <div className="w-px h-4 bg-white/10 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1 sm:gap-2 relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all border relative group ${
                  showNotifications 
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' 
                    : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-slate-300'
                }`}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-600 text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-lg shadow-rose-600/40 border border-white/10 animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationDropdown 
                  notifications={notifications} 
                  onMarkRead={vault.actions.handleMarkNotificationRead}
                  onClose={() => setShowNotifications(false)}
                />
              )}

              <button
                onClick={logout}
                title="Sign out"
                className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-200 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all hover:bg-white/5"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>

              <button
                onClick={() => navigate('/profile')}
                title="Account Settings"
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5 shadow-xl hover:border-blue-500/30 hover:bg-blue-500/10 transition-all group hover:scale-105 active:scale-95"
              >
                <User className="h-4 w-4 text-slate-400 group-hover:text-blue-400" />
              </button>
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
