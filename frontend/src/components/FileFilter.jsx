import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'Images', 'Video', 'Audio', 'Docs', 'Archives'];

const FileFilter = ({ activeCategory, setActiveCategory, searchTerm, setSearchTerm }) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
        <input
          type="text"
          placeholder="Search files or tags…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/20 group-hover:bg-slate-800/40 border border-white/[0.05] focus:border-blue-500/40 focus:bg-slate-800/60 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition-all outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all relative ${
              activeCategory === cat
                ? 'text-blue-400'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {activeCategory === cat && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-blue-500/10 border border-blue-500/30 rounded-full"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{cat}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FileFilter;
