import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import { PendingScreen, DeniedScreen } from './components/ProtectedRoute';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

function App() {
  const { token, status, loading, logout } = useAuth();

  // ── Hydration/Sync Stage ──
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
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] italic animate-pulse">Neural Synchronization</p>
        </motion.div>
      </div>
    );
  }

  // ── Authentication Gateway ──
  if (!token) return <LandingPage />;

  // ── Authorization Sentinel ──
  if (status === 'pending') return <PendingScreen onLogout={logout} />;
  if (status === 'denied') return <DeniedScreen onLogout={logout} />;

  // ── Approved Sector ──
  return <Dashboard />;
}

export default App;

