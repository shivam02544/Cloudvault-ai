import { useState } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';

const TagCloud = ({ tags = [], isEditable = false, onRemove, onAdd }) => {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
    }
    setNewTag('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {tags.length === 0 && !isAdding && (
        <span className="text-slate-600 text-xs italic flex items-center gap-1">
          <TagIcon size={11} /> No labels yet
        </span>
      )}

      {tags.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/15 transition-colors"
        >
          {tag}
          {isEditable && (
            <button
              onClick={() => onRemove(tag)}
              className="ml-0.5 p-0.5 rounded-full hover:bg-rose-500/20 hover:text-rose-400 text-indigo-400/60 transition-colors"
            >
              <X size={9} />
            </button>
          )}
        </span>
      ))}

      {isEditable && (
        isAdding ? (
          <form onSubmit={handleAdd} className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-200">
            <input
              autoFocus
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onBlur={() => { if (!newTag) setIsAdding(false); }}
              placeholder="tag name..."
              maxLength={24}
              className="bg-slate-900/80 border border-indigo-500/30 focus:border-indigo-500/60 rounded-full px-2.5 py-1 text-xs text-indigo-300 focus:outline-none w-28 placeholder:text-slate-600 transition-colors"
            />
            <button type="submit" className="p-1 bg-indigo-500/20 text-indigo-400 rounded-full hover:bg-indigo-500/30 transition-all">
              <Plus size={11} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-500 text-xs font-medium hover:bg-white/10 hover:text-slate-300 transition-all"
          >
            <Plus size={11} /> Add
          </button>
        )
      )}
    </div>
  );
};

export default TagCloud;
