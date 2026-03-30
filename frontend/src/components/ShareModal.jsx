import React, { useState } from 'react';
import { X, Share2, Globe, Lock, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function ShareModal({ file, onClose, onUpdate, token }) {
  const [isPublic, setIsPublic] = useState(file.isPublic || false);
  const [sharingId, setSharingId] = useState(file.sharingId);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const toggleSharing = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_URL}/files/sharing`,
        { fileId: file.fileId, isPublic: !isPublic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedIsPublic = res.data.isPublic;
      const updatedSharingId = res.data.sharingId;
      
      setIsPublic(updatedIsPublic);
      setSharingId(updatedSharingId);
      
      // Update local file state in App.js
      onUpdate({ ...file, isPublic: updatedIsPublic, sharingId: updatedSharingId });
    } catch (err) {
      console.error(err);
      setError('Failed to update sharing settings');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = sharingId ? `${window.location.origin}/s/${sharingId}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative glass p-8 rounded-3xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
               <Share2 className="h-5 w-5" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-100">Share File</h2>
               <p className="text-xs text-slate-500 truncate max-w-[200px]">{file.filename}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-lg mb-6">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
            </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl">
            <div className="flex items-center gap-3">
              {isPublic ? (
                 <Globe className="h-5 w-5 text-blue-400" />
              ) : (
                 <Lock className="h-5 w-5 text-slate-500" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {isPublic ? 'Publicly Shared' : 'Private Access'}
                </p>
                <p className="text-[10px] text-slate-600">
                  {isPublic ? 'Anyone with the link can view' : 'Only you can access this file'}
                </p>
              </div>
            </div>
            
            <button
               onClick={toggleSharing}
               disabled={loading}
               className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                  isPublic ? 'bg-blue-600' : 'bg-slate-700'
               }`}
            >
               <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                  isPublic ? 'translate-x-5' : 'translate-x-0'
               }`}>
                  {loading && (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin scale-[0.6]" />
                  )}
               </div>
            </button>
          </div>

          {isPublic && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-600">
                    Sharing Link
                </label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-2 text-xs text-slate-400 font-mono truncate">
                        {shareUrl}
                    </div>
                    <button
                        onClick={copyToClipboard}
                        className={`p-2.5 rounded-xl transition-all ${
                            copied 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                        }`}
                    >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                </div>
                <p className="text-[10px] text-slate-700 text-center italic">
                   Note: Links are currently persistent for 1 hour per session.
                </p>
            </div>
          )}
        </div>

        <button 
          onClick={onClose}
          className="w-full text-center text-sm font-medium text-slate-500 mt-8 hover:text-slate-300 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
