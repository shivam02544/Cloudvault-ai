import React, { useEffect, useState } from 'react';
import { X, FileText, Download, ExternalLink, Loader2, Tag, Shield, Sparkles } from 'lucide-react';
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
      if (res.data.success) {
        onUpdate({ ...file, tags: newTags });
      }
    } catch (err) {
      console.error('Failed to update tags:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTag = (tag) => {
    const currentTags = file.tags || [];
    if (!currentTags.includes(tag)) {
        handleUpdateTags([...currentTags, tag]);
    }
  };

  const handleRemoveTag = (tag) => {
     const currentTags = file.tags || [];
     handleUpdateTags(currentTags.filter(t => t !== tag));
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    addToast('Starting AI analysis...', 'info');
    try {
      const res = await axios.post(
        `${API_URL}/files/${file.fileId}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        addToast('AI Analysis complete!', 'success');
        onUpdate({ ...file, analyzed: true, tags: res.data.tags });
      }
    } catch (err) {
      console.error('Manual analysis failed:', err);
      const reason = err.response?.data?.reason;
      if (reason === 'file_too_large') {
          addToast('File too large for AI analysis (>5MB)', 'error');
      } else {
          addToast('AI Analysis failed', 'error');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };



  const renderViewer = () => {
    const type = file.contentType;

    if (type?.startsWith('image/')) {
      return (
        <img 
          src={url} 
          alt={file.filename} 
          className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
        />
      );
    }

    if (type?.startsWith('video/')) {
      return (
        <video controls autoPlay className="max-w-full max-h-[70vh] rounded-lg shadow-2xl">
          <source src={url} type={type} />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (type?.startsWith('audio/')) {
      return (
        <div className="bg-slate-800/80 p-12 rounded-2xl border border-slate-700 w-full max-w-md flex flex-col items-center">
          <div className="h-16 w-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 text-blue-400">
            <Music className="h-8 w-8" />
          </div>
          <audio controls autoPlay className="w-full">
            <source src={url} type={type} />
            Your browser does not support the audio tag.
          </audio>
          <p className="mt-4 text-slate-300 font-medium truncate w-full text-center">{file.filename}</p>
        </div>
      );
    }

    if (type === 'application/pdf') {
      return (
        <iframe 
          src={`${url}#toolbar=0`} 
          className="w-full h-[75vh] rounded-lg border border-slate-700 bg-white"
          title="PDF Preview"
        />
      );
    }

    // Default Fallback
    return (
      <div className="glass p-12 rounded-3xl flex flex-col items-center text-center max-w-sm">
        <div className="h-20 w-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-500 mb-6">
          <FileText className="h-10 w-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">No Preview Available</h3>
        <p className="text-slate-500 text-sm mb-8">
          This file type ({type || 'Unknown'}) cannot be previewed directly in the browser.
        </p>
        <div className="flex flex-col w-full gap-3">
            <a 
                href={url} 
                download={file.filename}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-all"
            >
                <Download className="h-4 w-4" />
                Download File
            </a>
            <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      id="preview-modal"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-5xl flex flex-col items-center animate-in fade-in zoom-in duration-300">
        
        {/* Top bar */}
        <div className="flex items-center justify-between w-full mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
               <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0">
               <h2 className="text-sm font-semibold text-slate-100 truncate max-w-[200px] sm:max-w-md">
                 {file.filename}
               </h2>
               <div className="flex items-center gap-2 mt-0.5">
                 <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-none">{file.contentType}</p>
                 {file.analyzed && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-tighter">
                      <Shield size={8} /> AI Analyzed
                    </span>
                 )}
                 {!file.analyzed && file.contentType?.startsWith('image/') && (
                    <button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold uppercase tracking-tighter hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                    >
                      <Sparkles size={8} className={isAnalyzing ? 'animate-pulse' : ''} />
                      {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                    </button>
                 )}
               </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-100 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
              title="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* AI Tag Management Section (Phase 10 Wave 3) */}
        <div className="w-full glass-card p-4 rounded-2xl mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Tag size={12} className="text-indigo-400" />
                Intelligence Labels 
                {(isUpdating || isAnalyzing) && <Loader2 size={12} className="animate-spin text-blue-500 ml-2" />}
              </h3>
           </div>
           
           {isAnalyzing ? (
              <div className="flex flex-wrap gap-2 animate-pulse">
                 {[1,2,3].map(i => (
                    <div key={i} className="h-6 w-16 bg-slate-800 rounded-full border border-white/5" />
                 ))}
                 <div className="h-6 w-24 bg-indigo-500/10 rounded-full border border-indigo-500/10" />
              </div>
           ) : (
              <TagCloud 
                tags={file.tags} 
                isEditable={true} 
                onAdd={handleAddTag} 
                onRemove={handleRemoveTag} 
              />
           )}
        </div>

        {/* Dynamic Viewer */}
        <div className="w-full flex justify-center items-center pointer-events-auto">
           <NSFWBlur moderationStatus={file.moderationStatus} className="w-full h-full flex justify-center">
             {renderViewer()}
           </NSFWBlur>
        </div>
      </div>
    </div>
  );
}

// Add Music icon for audio
function Music({ className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
