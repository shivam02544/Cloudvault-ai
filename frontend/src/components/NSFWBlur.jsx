import React, { useState } from 'react';
import { ShieldAlert, Eye, EyeOff } from 'lucide-react';

const NSFWBlur = ({ moderationStatus = 'SAFE', children, className = "" }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const isUnsafe = moderationStatus === 'UNSAFE';

  if (!isUnsafe) return <>{children}</>;

  return (
    <div className={`relative group/nsfw overflow-hidden rounded-xl ${className}`}>
      {/* Blurred Content */}
      <div className={`${!isRevealed ? 'blur-2xl scale-105 select-none pointer-events-none' : ''} transition-all duration-500 ease-in-out`}>
        {children}
      </div>

      {/* Static Overlay when blurred */}
      {!isRevealed && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="h-10 w-10 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-500 mb-2 border border-rose-500/30">
              <ShieldAlert size={20} />
           </div>
           <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1 text-center">
             Sensitive Content
           </p>
           <p className="text-[9px] text-slate-400 text-center mb-4 leading-tight max-w-[120px]">
             Hidden by AI Security
           </p>
           <button 
             onClick={(e) => {
               e.stopPropagation();
               setIsRevealed(true);
             }}
             className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-all border border-white/10"
           >
             <Eye size={12} /> Reveal
           </button>
        </div>
      )}

      {/* Reveal Toggle (Visible on hover when revealed) */}
      {isRevealed && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsRevealed(false);
          }}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-full bg-slate-900/80 text-rose-400 opacity-0 group-hover/nsfw:opacity-100 transition-opacity hover:bg-slate-800 border border-rose-500/30 shadow-lg"
          title="Hide sensitive content"
        >
          <EyeOff size={14} />
        </button>
      )}
    </div>
  );
};

export default NSFWBlur;
