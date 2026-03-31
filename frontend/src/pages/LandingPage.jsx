import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Brain, HardDrive, Zap, 
  ArrowRight, Globe, Lock, Activity, 
  CheckCircle2, Fingerprint, Eye, Database
} from 'lucide-react';
import { useRef } from 'react';

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    whileHover={{ y: -10, scale: 1.02 }}
    className="glass-premium p-10 rounded-[3rem] border border-white/[0.05] group cursor-default relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-10 opacity-[0.02] text-blue-500 group-hover:scale-110 transition-transform duration-1000">
      <Icon size={120} />
    </div>
    
    <div className="h-16 w-16 bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-white/10 rounded-3xl flex items-center justify-center text-blue-400 mb-8 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-500">
      <Icon size={28} />
    </div>
    
    <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 italic">{title}</h3>
    <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">
      {desc}
    </p>
  </motion.div>
);

const LandingPage = () => {
  const navigate = useNavigate();
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: targetRef });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="bg-[#05080f] text-[#f1f5f9] overflow-x-hidden selection:bg-blue-500/30">
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 w-full z-50 px-6 py-8 flex justify-between items-center max-w-7xl mx-auto left-1/2 -translate-x-1/2">
        <motion.div 
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="flex items-center gap-3 group cursor-pointer"
           onClick={() => navigate('/')}
        >
          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform duration-500">
            <Lock size={20} className="text-white" />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
            CloudVault <span className="text-blue-500 font-bold not-italic text-[10px] bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 tracking-widest uppercase">AI</span>
          </span>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           className="flex items-center gap-8"
        >
          <button onClick={() => navigate('/login')} className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors">Login</button>
          <button 
            onClick={() => navigate('/signup')}
            className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 hover:border-white/20 transition-all shadow-2xl"
          >
            Access Core
          </button>
        </motion.div>
      </nav>

      {/* ── Hero Section ── */}
      <section ref={targetRef} className="relative min-h-screen flex items-center justify-center pt-20 px-6 overflow-hidden">
        
      {/* Neural Background Layer */}
      <div className="fixed inset-0 pointer-events-none -z-10">
         <div className="absolute inset-0 bg-aurora opacity-70" />
         <div className="absolute inset-0 bg-grid-mesh opacity-30" />
         <div className="absolute top-1/4 left-1/4 w-[1000px] h-[1000px] bg-blue-600/10 blur-[200px] rounded-full animate-pulse-slow" />
         <div className="absolute bottom-1/4 right-1/4 w-[1000px] h-[1000px] bg-indigo-600/10 blur-[200px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

        <motion.div 
          style={{ opacity, scale }}
          className="max-w-5xl text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] mb-8 animate-pulse">
              <Zap size={12} className="fill-blue-500" /> Intelligence Layer 1.0.4 Live
            </span>
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter text-white uppercase italic leading-[0.85] mb-8">
              SECURE YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">DIGITAL SOUL</span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-500 font-bold uppercase tracking-[0.25em] leading-relaxed mb-12 opacity-80">
              The world's first AI-powered file custodian. Not just storage—Autonomous asset intelligence and cryptographic neural protection.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
                className="group px-12 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] text-white text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-blue-500/40 flex items-center gap-3 transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                Initialize Vault <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="px-12 py-6 glass rounded-[2rem] text-slate-400 hover:text-white border border-white/5 hover:border-white/20 transition-all text-[12px] font-black uppercase tracking-[0.4em]"
              >
                Explore Protocol
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Global Asset Visualization Grid (Simulated) */}
        <div className="absolute bottom-0 w-full h-[30vh] bg-gradient-to-t from-[#05080f] to-transparent z-20" />
        <div className="absolute bottom-0 inset-x-0 h-[40vh] bg-grid-mesh -z-10" />
      </section>

      {/* ── Feature Convergence ── */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.6em] mb-4">Core Capacities</h2>
          <p className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Neural Object Management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <FeatureCard 
            icon={Brain}
            title="AI Image Vision"
            desc="Our proprietary neural network deep-scans every upload for safety and intelligence-tagging in real-time."
            delay={0.1}
          />
          <FeatureCard 
            icon={Shield}
            title="Command Center"
            desc="Military-grade administrative oversight ensures every system entity remains within operational safety parameters."
            delay={0.2}
          />
          <FeatureCard 
            icon={Fingerprint}
            title="Cognito Identity"
            desc="Synchronized AWS Cognito protection ensuring zero-trust identity verification across the global grid."
            delay={0.3}
          />
        </div>
      </section>

      {/* ── Stats Ticker (Simulated) ── */}
      <section className="py-20 border-y border-white/[0.03] bg-white/[0.01]">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {[
              { label: 'Network Uptime', value: '99.98%', icon: Activity },
              { label: 'Neural Throughput', value: '1.2 PB/s', icon: Zap },
              { label: 'Security Protocols', value: '10k+', icon: Shield },
              { label: 'Assets Secured', value: '2.4M', icon: Database }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl font-black text-white tracking-widest mb-2 italic uppercase">{stat.value}</p>
                <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                   <stat.icon size={10} className="text-blue-500" /> {stat.label}
                </div>
              </motion.div>
            ))}
         </div>
      </section>

      {/* ── Final Call ── */}
      <section className="py-40 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-500/5 blur-[150px] -z-10 rounded-full" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-5xl sm:text-7xl font-black text-white italic tracking-tighter uppercase mb-20 leading-[0.9]">
            THE FUTURE OF <br /> 
            <span className="text-blue-500">DIGITAL OWNERSHIP</span> <br /> 
            IS SYSTEM CORE.
          </h2>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')} 
            className="px-16 py-8 bg-blue-600 rounded-[3rem] text-white text-[14px] font-black uppercase tracking-[0.5em] shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] transition-all"
          >
            Access The Grid
          </motion.button>
          
          <p className="mt-12 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
            Zero-Trust Verification Required
          </p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-20 px-6 border-t border-white/[0.03] text-center">
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">
            © 2026 CloudVault AI Intelligence. Developed for PrabhuJee Architecture.
         </p>
      </footer>

    </div>
  );
};

export default LandingPage;
