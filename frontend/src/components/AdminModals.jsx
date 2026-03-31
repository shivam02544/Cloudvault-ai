import { X, Bell, Send, Loader2, CheckCircle2, Sliders, Download, ExternalLink, ShieldAlert, Music } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ModalWrapper = ({ children, onClose, maxWidth = 'max-w-md' }) => (
  <div 
    className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-950/60 transition-all duration-300 animate-in fade-in"
    onClick={onClose}
  >
    <div 
      className={`glass-auth w-full ${maxWidth} p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-white/[0.08] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300`}
      onClick={e => e.stopPropagation()}
    >
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 blur-[60px] rounded-full" />
      {children}
    </div>
  </div>
);

export const AdminNotifyModal = ({ user, token, onClose }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await axios.post(`${API_URL}/admin/users/${user.userId}/notify`,
        { targetUserId: user.userId, subject, message, type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSent(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose}>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Bell size={16} className="text-blue-500" /> Send Notification
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        {sent ? (
          <div className="py-10 flex flex-col items-center gap-6 text-emerald-400 animate-in zoom-in-95">
             <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
               <CheckCircle2 size={32} className="animate-bounce" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Message Sent</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 relative z-10">
             <div className="flex gap-2 flex-wrap">
              {['info', 'warning', 'success'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                    type === t
                      ? t === 'info' ? 'bg-blue-600 text-white border-blue-400/30'
                        : t === 'warning' ? 'bg-amber-600 text-white border-amber-400/30'
                        : 'bg-emerald-600 text-white border-emerald-400/30'
                      : 'bg-slate-900/50 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
                  }`}>{t}</button>
              ))}
            </div>
            
            <div className="space-y-4">
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="SUBJECT"
                className="w-full input-auth italic font-bold tracking-widest placeholder-slate-700 uppercase h-12" />
              
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="MESSAGE..." rows={4}
                className="w-full bg-slate-900/50 border border-white/[0.05] focus:border-blue-500/40 rounded-2xl px-5 py-4 text-xs text-white placeholder-slate-700 outline-none transition-all resize-none italic font-medium" />
            </div>

            <button onClick={send} disabled={sending || !subject.trim() || !message.trim()}
              className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.4em] transition-all disabled:opacity-30 flex items-center justify-center gap-3 active:scale-[0.98]">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        )}
    </ModalWrapper>
  );
};

export const AdminLimitsModal = ({ user, token, onClose, onSaved }) => {
  const GB = 1024 * 1024 * 1024;
  const [storageGB, setStorageGB] = useState(((user.storageLimit || 5 * GB) / GB).toString());
  const [maxFileMB, setMaxFileMB] = useState(((user.maxFileSize || 1024 * 1024 * 1024) / (1024 * 1024)).toString());
  const [notes, setNotes] = useState(user.notes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API_URL}/admin/users/${user.userId}/limits`,
        { storageLimit: parseFloat(storageGB) * GB, maxFileSize: parseFloat(maxFileMB) * 1024 * 1024, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSaved({ ...user, storageLimit: parseFloat(storageGB) * GB, maxFileSize: parseFloat(maxFileMB) * 1024 * 1024, notes });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper onClose={onClose} maxWidth="max-w-sm">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Sliders size={16} className="text-purple-500" /> Manage Limits
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        <div className="space-y-6 sm:space-y-8 mb-8 relative z-10">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2 sm:mb-3 ml-2 flex items-center gap-2">
               Total Storage (GB)
            </label>
            <input type="number" min="0.1" step="0.5" value={storageGB} onChange={e => setStorageGB(e.target.value)}
              className="w-full input-auth font-mono text-center tracking-[0.2em] h-12" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2 sm:mb-3 ml-2 flex items-center gap-2">
               Max File Size (MB)
            </label>
            <input type="number" min="1" step="1" value={maxFileMB} onChange={e => setMaxFileMB(e.target.value)}
              className="w-full input-auth font-mono text-center tracking-[0.2em] h-12" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-2 ml-2">Internal Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observations..."
              className="w-full bg-slate-900/50 border border-white/[0.05] focus:border-purple-500/40 rounded-xl sm:rounded-2xl px-5 py-4 text-xs text-white outline-none transition-all resize-none italic font-medium" />
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-[0.98]">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
        </button>
    </ModalWrapper>
  );
};

export const AdminPreviewModal = ({ file, url, onClose }) => {
  if (!file || !url) return null;
  const isImage = file.contentType?.startsWith('image/');
  const isVideo = file.contentType?.startsWith('video/');
  const isAudio = file.contentType?.startsWith('audio/');
  const isPdf = file.contentType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 backdrop-blur-2xl bg-slate-950/60 transition-all animate-in fade-in" onClick={onClose}>
      <div 
        className="glass-premium w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-white/[0.1] shadow-2xl rounded-[2rem] sm:rounded-[3rem] animate-in zoom-in-95 duration-500"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 sm:px-8 py-4 sm:py-6 bg-slate-900/40 border-b border-white/[0.05] relative overflow-hidden group">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0 relative z-10 w-full sm:w-auto">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-[1.25rem] bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shrink-0 shadow-lg">
              <Download size={20} className="animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[12px] sm:text-[13px] font-black text-white italic truncate tracking-tight">{file.filename}</h4>
              <p className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1 opacity-60">
                Details: {formatBytes(file.size)} · {file.contentType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10 mt-4 sm:mt-0 justify-end">
            <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 sm:p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl sm:rounded-2xl transition-all"><ExternalLink size={18} className="sm:size-[20px]" /></a>
            <a href={url} download={file.filename} className="p-2 sm:p-3 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl sm:rounded-2xl transition-all"><Download size={18} className="sm:size-[20px]" /></a>
            <div className="w-px h-6 sm:h-8 bg-white/[0.05] mx-1 sm:mx-2" />
            <button onClick={onClose} className="p-2 sm:p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl sm:rounded-2xl transition-all"><X size={20} className="sm:size-[22px]" /></button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950/80 overflow-auto flex items-center justify-center p-6 sm:p-12 min-h-[350px] relative">
          {isImage && <img src={url} alt={file.filename} className="max-w-full max-h-full object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-white/[0.05]" />}
          {isVideo && <video src={url} controls autoPlay className="max-w-full max-h-full rounded-xl sm:rounded-2xl w-full h-full shadow-2xl" />}
          {isAudio && (
             <div className="flex flex-col items-center gap-8 sm:gap-10 w-full">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[1.5rem] sm:rounded-[2rem] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-2xl">
                   <Music size={32} className="sm:size-[40px] animate-pulse" />
                </div>
                <audio src={url} controls className="w-full max-w-xs h-10 invert brightness-200" />
             </div>
          )}
          {isPdf && <iframe src={url} title={file.filename} className="w-full h-[60vh] sm:h-[70vh] border-0 rounded-xl sm:rounded-2xl bg-white/5" />}
          {!isImage && !isVideo && !isAudio && !isPdf && (
            <div className="text-center space-y-6 sm:space-y-8 py-10 px-4">
               <div className="h-20 w-20 sm:h-24 sm:w-24 mx-auto rounded-2xl sm:rounded-[2rem] bg-slate-900/60 flex items-center justify-center text-slate-700 border border-white/[0.03] shadow-inner">
                  <ShieldAlert size={40} className="sm:size-[48px]" />
               </div>
               <div>
                  <p className="text-white font-black uppercase tracking-[0.4em] text-[10px] sm:text-[11px] italic">Format not supported for preview</p>
                  <p className="text-slate-600 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mt-3 opacity-60">You can download this file for manual review</p>
               </div>
               <a href={url} download={file.filename} className="inline-flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all w-full sm:w-auto justify-center">
                  <Download size={14} /> Download File
               </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
