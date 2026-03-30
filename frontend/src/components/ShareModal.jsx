import { useState } from 'react';
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
    setLoading(true); setError(null);
    try {
      const res = await axios.post(
        `${API_URL}/files/sharing`,
        { fileId: file.fileId, isPublic: !isPublic },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsPublic(res.data.isPublic);
      setSharingId(res.data.sharingId);
      onUpdate({ ...file, isPublic: res.data.isPublic, sharingId: res.data.sharingId });
    } catch {
      setError('Failed to update sharing settings');
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = sharingId ? `${window.location.origin}/s/${sharingId}` : '';

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass p-7 rounded-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/15">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Share File</h2>
              <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{file.filename}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-2 rounded-lg mb-4">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl mb-4">
          <div className="flex items-center gap-3">
            {isPublic
              ? <Globe className="h-4 w-4 text-blue-400" />
              : <Lock className="h-4 w-4 text-slate-500" />}
            <div>
              <p className="text-sm font-medium text-slate-200">{isPublic ? 'Public link' : 'Private'}</p>
              <p className="text-[10px] text-slate-600">{isPublic ? 'Anyone with the link can view' : 'Only you can access'}</p>
            </div>
          </div>
          <button
            onClick={toggleSharing}
            disabled={loading}
            className={`relative w-10 h-5.5 rounded-full transition-colors focus:outline-none ${isPublic ? 'bg-blue-600' : 'bg-slate-700'}`}
            style={{ height: '22px' }}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 flex items-center justify-center ${isPublic ? 'translate-x-[18px]' : 'translate-x-0'}`}>
              {loading && <Loader2 className="h-3 w-3 text-blue-600 animate-spin" />}
            </div>
          </button>
        </div>

        {/* Share URL */}
        {isPublic && (
          <div className="animate-in slide-in-from-top-2 duration-200 space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-600">Share link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900/60 border border-white/[0.06] rounded-lg px-3 py-2 text-[11px] text-slate-400 font-mono truncate">
                {shareUrl}
              </div>
              <button
                onClick={copy}
                className={`p-2 rounded-lg transition-all shrink-0 ${copied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'}`}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        <button onClick={onClose} className="w-full text-center text-xs text-slate-600 mt-6 hover:text-slate-400 transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}
