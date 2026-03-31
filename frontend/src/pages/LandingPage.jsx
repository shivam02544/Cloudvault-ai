import { useNavigate } from 'react-router-dom';
import { 
  Shield, Brain, HardDrive, Zap, 
  ArrowRight, Globe, Lock, Activity, 
  CheckCircle2, Fingerprint, Eye, Database, Menu, X
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="glass-premium p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-white/[0.05] group cursor-default relative overflow-hidden transition-all duration-500 hover:-translate-y-2">
    <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-blue-500 group-hover:scale-110 transition-transform duration-1000">
      <Icon size={120} />
    </div>
    
    <div className="h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center text-blue-400 mb-6 sm:mb-8 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-500">
      <Icon size={24} className="sm:size-[28px]" />
    </div>
    
    <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tighter mb-3 sm:mb-4 italic">{title}</h3>
    <p className="text-[12px] sm:text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
      {desc}
    </p>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-[#05080f] text-[#f1f5f9] overflow-x-hidden selection:bg-blue-500/30 font-sans">
      
      {/* ── Background (Static) ── */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-50" />
         <div className="absolute inset-0 bg-grid-mesh opacity-20" />
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      {/* ── Navigation ── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${isScrolled ? 'py-4 bg-[#05080f]/80 backdrop-blur-xl border-b border-white/5' : 'py-8'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div 
             className="flex items-center gap-3 group cursor-pointer"
             onClick={() => navigate('/')}
          >
            <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 transition-transform duration-500 group-hover:rotate-12">
              <Lock size={20} className="text-white" />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
              CloudVault <span className="text-blue-500 font-bold not-italic text-[10px] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 tracking-widest uppercase">AI</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => navigate('/login')} className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">Login</button>
            <button 
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:border-white/20 transition-all shadow-2xl"
            >
              Access Vault
            </button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="lg:hidden text-white p-2 hover:bg-white/5 rounded-xl transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 bg-[#05080f]/95 backdrop-blur-2xl z-40 lg:hidden transition-all duration-500 ${isMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
          <div className="flex flex-col items-center justify-center h-full gap-12 text-center">
            <div className="space-y-8">
              <button onClick={() => { navigate('/login'); setIsMenuOpen(false); }} className="block w-full text-2xl font-black uppercase tracking-[0.4em] text-slate-500 hover:text-white">Login</button>
              <button 
                onClick={() => { navigate('/signup'); setIsMenuOpen(false); }}
                className="block w-full px-12 py-5 bg-blue-600 rounded-full text-lg font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-blue-500/20"
              >
                Access Vault
              </button>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="text-slate-600 uppercase tracking-widest text-[10px] font-black">Close Protocol</button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-6">
        <div className="max-w-5xl text-center relative z-10">
          <div className="mb-8 block">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] animate-pulse">
              <Zap size={12} className="fill-blue-500" /> Secure Protocol 1.0.4 Live
            </span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white uppercase italic leading-[0.9] mb-8 lg:mb-12">
            PROTECT YOUR <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">DIGITAL ASSETS</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-[12px] sm:text-sm md:text-lg text-slate-500 font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] leading-relaxed mb-12 sm:mb-16 opacity-80">
            Professional Cloud Infrastructure. Not just storage—Autonomous security and cryptographic asset protection across the global grid.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={() => navigate('/signup')}
              className="group w-full sm:w-auto px-12 py-5 sm:py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl sm:rounded-[2rem] text-white text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-3 transition-all hover:-translate-y-1"
            >
              Register Vault <ArrowRight size={16} className="transition-transform group-hover:translate-x-2" />
            </button>
            <button 
              className="px-12 py-5 sm:py-6 glass w-full sm:w-auto rounded-2xl sm:rounded-[2rem] text-slate-400 hover:text-white border border-white/5 hover:border-white/20 transition-all text-[12px] font-black uppercase tracking-[0.4em]"
            >
              Our Protocol
            </button>
          </div>
        </div>

        {/* Decorative Grid */}
        <div className="absolute bottom-0 w-full h-[30vh] bg-gradient-to-t from-[#05080f] to-transparent z-20" />
        <div className="absolute bottom-0 inset-x-0 h-[40vh] bg-grid-mesh opacity-30 -z-10" />
      </section>

      {/* ── Feature Grid ── */}
      <section className="py-24 sm:py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 sm:mb-24">
          <h2 className="text-[10px] sm:text-[11px] font-black text-blue-500 uppercase tracking-[0.6em] mb-4">Core Capacities</h2>
          <p className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Global Asset Protection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          <FeatureCard 
            icon={Brain}
            title="Image Intelligence"
            desc="Our proprietary algorithms scan every upload for security and intelligent organization in real-time."
          />
          <FeatureCard 
            icon={Shield}
            title="Admin Portal"
            desc="Military-grade administrative oversight ensures every system entity remains within operational safety parameters."
          />
          <FeatureCard 
            icon={Fingerprint}
            title="Secure Identity"
            desc="Synchronized AWS Cognito protection ensuring zero-trust identity verification across the global grid."
          />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 sm:py-20 border-y border-white/[0.03] bg-white/[0.01]">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16 text-center">
            {[
              { label: 'Uptime Protocol', value: '99.98%', icon: Activity },
              { label: 'Vault Throughput', value: '1.2 PB/s', icon: Zap },
              { label: 'Security Layers', value: '10k+', icon: Shield },
              { label: 'Cloud Units', value: '2.4M', icon: Database }
            ].map((stat, i) => (
              <div key={i} className="transition-all hover:scale-105">
                <p className="text-2xl sm:text-3xl font-black text-white tracking-widest mb-2 italic uppercase">{stat.value}</p>
                <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                   <stat.icon size={10} className="text-blue-500" /> {stat.label}
                </div>
              </div>
            ))}
         </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 sm:py-48 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[1000px] h-[400px] sm:h-[600px] bg-blue-500/5 blur-[150px] -z-10 rounded-full" />
        
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase mb-16 sm:mb-20 leading-[0.9]">
            THE FUTURE OF <br /> 
            <span className="text-blue-500">DIGITAL STORAGE</span> <br /> 
            IS SYSTEM CORE.
          </h2>
          
          <button
            onClick={() => navigate('/signup')} 
            className="w-full sm:w-auto px-16 py-6 sm:py-8 bg-blue-600 rounded-2xl sm:rounded-[3rem] text-white text-[14px] font-black uppercase tracking-[0.5em] shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] transition-all hover:-translate-y-2"
          >
            Access The Vault
          </button>
          
          <p className="mt-12 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
            Zero-Trust Protocol Required
          </p>
        </div>
      </section>

      <footer className="py-16 sm:py-20 px-6 border-t border-white/[0.03] text-center">
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
            © 2026 CloudVault AI Intelligence. Universal Cloud Architecture.
         </p>
      </footer>

    </div>
  );
};

export default LandingPage;
