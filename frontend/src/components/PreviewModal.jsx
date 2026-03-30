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
    setIsUpdating(true);
    try {
      const res = await axios.patch(
        `${API_URL}/files/${file.fileId}/tags`,
        { tags: newTags },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) onUpdate({ ...file, tags: newTags });
    } catch { console.error('Failed to update tags'); }
    finally { setIsUpdating(false); }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    addToast('Starting AI analysis…', 'info');
    try {
      const res = await axios.post(`${API_URL}/files/${file.fileId}/analyze`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        addToast('AI analysis complete', 'success');
        onUpdate({ ...file, analyzed: true, tags: res.data.tags });
      }
    } catch (err) {
      const reason = err.response?.data?.reason;
      addToast(reason === 'file_too_large' ? 'File too large for AI analysis (>5MB)' : 'AI analysis failed', 'error');
    } finally { setIsAnalyzing(false); }
  };

  const type = file.contentType;

  const renderViewer = () => {
    if (type?.startsWith('image/')) return (
      <img src={url} alt={file.filename} className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-2xl" />
    );
    if (type?.startsWith('video/')) return (
      <video controls autoPlay className="max-w-full max-h-[65vh] rounded-xl shadow-2xl">
        <source src={url} type={type} />
      </video>
    );
    if (type?.startsWith('audio/')) return (
      <div className="bg-slate-900/60 border border-white/[0.06] p-10 rounded-2xl flex flex-col items-center gap-5 w-full max-w-sm">
        <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/15">
          <Music className="h-8 w-8" />
        </div>
        <p className="text-sm font-medium text-slate-300 truncate w-full text-center">{file.filename}</p>
        <audio controls autoPlay className="w-full"><source src={url} type={type} /></audio>
      </div>
    );
    if (type === 'application/pdf') return (
      <iframe src={`${url}#toolbar=0`} className="w-full h-[68vh] rounded-xl border border-white/[0.06] bg-white" title="PDF" />
    );
    return (
      <div className="glass p-10 rounded-2xl flex flex-col items-center text-center max-w-xs gap-4">
        <div className="h-16 w-16 bg-slate-800/60 rounded-2xl flex items-center justify-center text-slate-500">
          <FileQuestion className="h-8 w-8" />
        </div>
        <div>
          <p className="font-semibold text-slate-200">No preview available</p>
          <p className="text-slate-500 text-sm mt-1">{type || 'Unknown type'} cannot be previewed in the browser.</p>
        </div>
        <a href={url} download={file.filename}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors w-full justify-center">
          <Download className="h-4 w-4" /> Download
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-4xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
        {/* Top bar */}
        <div className="flex items-center justify-between w-full mb-3 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 border border-blue-500/15 shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate max-w-[220px] sm:max-w-md">{file.filename}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{type}</span>
                {file.analyzed && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">
                    <Shield size={8} /> AI Analyzed
                  </span>
                )}
                {!file.analyzed && type?.startsWith('image/') && (
                  <button onClick={handleAnalyze} disabled={isAnalyzing}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold uppercase hover:bg-indigo-500/20 transition-all disabled:opacity-50">
                    <Sparkles size={8} className={isAnalyzing ? 'animate-pulse' : ''} />
                    {isAnalyzing ? 'Analyzing…' : 'Analyze'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="p-2 text-slate-500 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-all" title="Open in new tab">
              <ExternalLink className="h-4 w-4" />
            </a>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="w-full glass-card px-4 py-3 rounded-xl mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Tag size={11} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Labels</span>
            {(isUpdating || isAnalyzing) && <Loader2 size={11} className="animate-spin text-blue-400 ml-1" />}
          </div>
          {isAnalyzing ? (
            <div className="flex gap-2 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-6 w-14 bg-slate-800 rounded-full" />)}
            </div>
          ) : (
            <TagCloud tags={file.tags} isEditable onAdd={t => handleUpdateTags([...(file.tags||[]), t])} onRemove={t => handleUpdateTags((file.tags||[]).filter(x => x !== t))} />
          )}
        </div>

        {/* Viewer */}
        <div className="w-full flex justify-center items-center">
          <NSFWBlur moderationStatus={file.moderationStatus} className="w-full flex justify-center">
            {renderViewer()}
          </NSFWBlur>
        </div>
      </div>
    </div>
  );
}
