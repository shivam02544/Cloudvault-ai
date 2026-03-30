import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';

const TagCloud = ({ tags = [], isEditable = false, onRemove, onAdd }) => {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAdd(newTag.trim());
      setNewTag('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {tags.length === 0 && !isAdding && (
        <span className="text-slate-500 text-xs italic flex items-center gap-1">
          <TagIcon size={12} /> No tags yet
        </span>
      )}
      
      {tags.map((tag, index) => (
        <span 
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/10 transition-colors duration-200"
        >
          {tag}
          {isEditable && (
            <button
              onClick={() => onRemove(tag)}
              className="p-0.5 hover:bg-red-500/20 hover:text-red-400 rounded-full transition-colors"
              title="Remove tag"
            >
              <X size={10} />
            </button>
          )}
        </span>
      ))}

      {isEditable && (
        <div className="flex items-center">
          {isAdding ? (
            <form onSubmit={handleAdd} className="flex items-center gap-1 animate-in fade-in slide-in-from-left-4 duration-300">
              <input
                autoFocus
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onBlur={() => !newTag && setIsAdding(false)}
                placeholder="New tag..."
                className="bg-slate-900/60 border border-indigo-500/30 rounded-full px-2.5 py-1 text-xs text-indigo-300 focus:outline-none focus:border-indigo-500/60 w-24 placeholder:text-slate-600 transition-all"
              />
              <button
                type="submit"
                className="p-1 bg-indigo-500/20 text-indigo-400 rounded-full hover:bg-indigo-500/30 transition-all"
              >
                <Plus size={12} />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-all duration-200"
            >
              <Plus size={12} /> Add Tag
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TagCloud;
