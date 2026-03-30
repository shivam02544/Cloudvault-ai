import { useState } from 'react';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';

const NSFWBlur = ({ moderationStatus = 'SAFE', children, className = '' }) => {
  const [revealed, setRevealed] = useState(false);
  if (moderationStatus !== 'UNSAFE') return <>{children}</>;

  return (
    <div className={`relative group/nsfw overflow-hidden rounded-xl ${className}`}>
      <div className={`transition-all duration-500 ${!revealed ? 'blur-2xl scale-105 select-none pointer-events-none' : ''}`}>
        {children}
      </div>

      {!revealed && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-950/50 backdrop-blur-sm">
          <div className="h-9 w-9 bg-rose-500/15 rounded-full flex items-center justify-center text-rose-400 border border-rose-500/25">
            <ShieldAlert size={18} />
          </div>
          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Sensitive</p>
          <button
            onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold transition-all border border-white/10"
          >
            <Eye size={11} /> Reveal
          </button>
        </div>
      )}

      {revealed && (
        <button
          onClick={(e) => { e.stopPropagation(); setRevealed(false); }}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-slate-900/80 text-rose-400 opacity-0 group-hover/nsfw:opacity-100 transition-opacity hover:bg-slate-800 border border-rose-500/25 shadow-lg"
          title="Hide"
        >
          <EyeOff size={13} />
        </button>
      )}
    </div>
  );
};

export default NSFWBlur;
