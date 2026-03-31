import { Search, X } from 'lucide-react';

const CATEGORIES = ['All', 'Images', 'Video', 'Audio', 'Docs', 'Archives'];

const FileFilter = ({ activeCategory, setActiveCategory, searchTerm, setSearchTerm }) => {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors z-10" />
        <input
          type="text"
          placeholder="SEARCH FILES..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full input-auth pl-12 pr-12 py-4 italic font-black tracking-widest uppercase placeholder-slate-700 h-14 sm:h-16 text-[13px] sm:text-[14px]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all animate-in fade-in zoom-in-95"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category Selection */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 sm:px-5 py-2.5 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group/btn ${
              activeCategory === cat
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-300 bg-white/[0.02] border border-transparent hover:border-white/[0.05]'
            }`}
          >
            {activeCategory === cat && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 rounded-2xl shadow-[0_5px_15px_rgba(37,99,235,0.2)] animate-in fade-in zoom-in-95 duration-300" />
            )}
            <span className="relative z-10">{cat}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FileFilter;
