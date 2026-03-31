import { useState } from 'react';
import {
  X, FileText, Download, ExternalLink, Loader2,
  Tag, Shield, Sparkles, Music, FileQuestion
} from 'lucide-react';
import TagCloud from './TagCloud';
import NSFWBlur from './NSFWBlur';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL;

export default function PreviewModal({ file, url, token, onUpdate, onClose }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { addToast } = useToast();

  if (!file || !url) return null;

  const handleUpdateTags = async (newTags) => {
    // Deduplicate
    const unique = [...new Set(newTags.map(t => t.trim().toLowerCase()).filter(Boolean))];
    setIsUpdating(true);
    try {
      const res = await axios.patch(
        `${API_URL}/files/${file.fileId}/tags`,
        { tags: unique },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) onUpdate({ ...file, tags: unique });
    } catch { addToast('Failed to update tags', 'error'); }
    finally { setIsUpdating(false); }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    addToast('Scanning File…', 'info');
    try {
      const res = await axios.post(
        `${API_URL}/files/${file.fileId}/analyze`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        addToast('Scan Complete', 'success');
        onUpdate({ ...file, analyzed: true, tags: res.data.tags || file.tags });
      }
    } catch (err) {
      const reason = err.response?.data?.reason;
      addToast(reason === 'file_too_large' ? 'File too large for analysis (>5MB)' : 'Scan failed', 'error');
    } finally { setIsAnalyzing(false); }
  };

  const type = file.contentType;

  const renderViewer = () => {
    if (type?.startsWith('image/')) return (
      <img src={url} alt={file.filename} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/5" />
    );
    if (type?.startsWith('video/')) return (
      <video controls autoPlay className="max-w-full max-h-full rounded-xl w-full shadow-2xl border border-white/10">
        <source src={url} type={type} />
      </video>
    );
    if (type?.startsWith('audio/')) return (
      <div className="flex flex-col items-center gap-6 p-6 sm:p-10 w-full max-w-sm glass-premium rounded-3xl border border-white/5">
        <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-lg">
          <Music className="h-8 w-8" />
        </div>
        <p className="text-[13px] font-bold text-slate-300 truncate w-full text-center px-4 italic">{file.filename}</p>
        <audio controls autoPlay className="w-full h-10 invert brightness-200"><source src={url} type={type} /></audio>
      </div>
    );
    if (type === 'application/pdf') return (
      <iframe src={`${url}#toolbar=0`} className="w-full h-full min-h-[50vh] sm:min-h-[60vh] rounded-xl border border-white/[0.06] bg-white/5" title="PDF" />
    );
    return (
      <div className="flex flex-col items-center text-center gap-6 p-8 max-w-xs glass-premium rounded-[2rem] border border-white/5">
        <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-600 border border-white/5 shadow-inner">
          <FileQuestion className="h-8 w-8" />
        </div>
        <div>
          <p className="font-black text-[12px] uppercase tracking-widest text-slate-200 italic">No Preview Available</p>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">{type || 'Unknown type'}</p>
        </div>
        <a href={url} download={file.filename}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-xl transition-all w-full justify-center shadow-lg active:scale-[0.98]">
          <Download className="h-4 w-4" /> Download
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300" onClick={onClose} />

      <div className="relative min-h-full flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-4xl bg-[#0c1220] border border-white/[0.08] rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-500"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 bg-[#0c1220]/95 backdrop-blur-md border-b border-white/[0.07]">
            <div className="flex items-center gap-4 min-w-0">
              <div className="h-10 w-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shrink-0 shadow-lg">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[13px] font-black text-white italic truncate max-w-[200px] sm:max-w-md tracking-tight">{file.filename}</h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{type}</span>
                  {file.analyzed && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">
                      <Shield size={10} /> Safe Scan
                    </span>
                  )}
                  {!file.analyzed && type?.startsWith('image/') && (
                    <button onClick={handleAnalyze} disabled={isAnalyzing}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest hover:bg-indigo-500/30 transition-all disabled:opacity-50">
                      <Sparkles size={10} className={isAnalyzing ? 'animate-pulse' : ''} />
                      {isAnalyzing ? 'Scanning…' : 'Scan'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-4 sm:pt-0 border-t border-white/[0.03] sm:border-0">
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="Open External">
                <ExternalLink size={18} />
              </a>
              <a href={url} download={file.filename}
                className="p-3 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all" title="Download">
                <Download size={18} />
              </a>
              <div className="w-px h-8 bg-white/[0.05] mx-1" />
              <button
                onClick={onClose}
                className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="px-6 py-4 border-b border-white/[0.06] bg-white/[0.01]">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Tags</span>
              {isUpdating && <Loader2 size={12} className="animate-spin text-blue-400" />}
            </div>
            {isAnalyzing ? (
              <div className="flex gap-2 animate-pulse mb-1">
                {[1,2,3].map(i => <div key={i} className="h-7 w-16 bg-slate-900 rounded-lg" />)}
              </div>
            ) : (
              <TagCloud
                tags={file.tags || []}
                isEditable
                onAdd={tag => {
                  const current = file.tags || [];
                  if (!current.includes(tag)) handleUpdateTags([...current, tag]);
                }}
                onRemove={tag => handleUpdateTags((file.tags || []).filter(t => t !== tag))}
              />
            )}
          </div>

          {/* Viewer */}
          <div className="flex items-center justify-center bg-slate-950/80 min-h-[300px] sm:min-h-[400px] p-6 sm:p-10 relative">
            <NSFWBlur moderationStatus={file.moderationStatus} className="w-full flex justify-center items-center">
              {renderViewer()}
            </NSFWBlur>
          </div>
        </div>
      </div>
    </div>
  );
}
