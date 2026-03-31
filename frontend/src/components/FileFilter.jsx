import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Images', 'Video', 'Audio', 'Docs', 'Archives'];

const FileFilter = ({ activeCategory, setActiveCategory, searchTerm, setSearchTerm }) => {
  return (
    <div className="space-y-6">
      {/* Search Bar: Selector Portal */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors z-10" />
        <input
          type="text"
          placeholder="SEARCH UNIT INDEX..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full input-auth pl-12 pr-12 py-4 italic font-black tracking-widest uppercase placeholder-slate-700 h-14 sm:h-16"
        />
        <AnimatePresence>
          {searchTerm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setSearchTerm('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
            >
              <X size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Category Selection Array */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat, idx) => (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group/btn ${
              activeCategory === cat
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300 bg-white/[0.02] border border-transparent hover:border-white/[0.05]'
            }`}
          >
            {activeCategory === cat && (
              <motion.div
                layoutId="activeCategory"
                className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 rounded-2xl shadow-[0_5px_15px_rgba(37,99,235,0.2)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{cat}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FileFilter;
