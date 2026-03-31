import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import { PendingScreen, DeniedScreen } from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

function App() {
  const { token, status, loading, logout } = useAuth();

  // ── Hydration/Sync Stage ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#05080f] relative overflow-hidden px-6">
        {/* Background Layer (Static) */}
        <div className="fixed inset-0 pointer-events-none -z-10">
           <div className="absolute inset-0 bg-aurora opacity-30" />
           <div className="absolute inset-0 bg-grid-mesh opacity-10" />
        </div>
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-700">
          <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] italic animate-pulse text-center">Connecting to CloudVault...</p>
        </div>
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
