import { X, Bell, Send, Loader2, CheckCircle2, Sliders, Download, ExternalLink, FileQuestion, Zap, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/40"
    onClick={onClose}
  >
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      className={`glass-auth w-full ${maxWidth} p-10 rounded-[2.5rem] border border-white/[0.08] shadow-2xl relative overflow-hidden`}
      onClick={e => e.stopPropagation()}
    >
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 blur-[60px] rounded-full" />
      {children}
    </motion.div>
  </motion.div>
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
        <div className="flex items-center justify-between mb-10 relative z-10">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Bell size={16} className="text-blue-500 animate-pulse" /> Dispatch Core
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        {sent ? (
          <div className="py-12 flex flex-col items-center gap-6 text-emerald-400">
             <div className="h-20 w-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20">
               <CheckCircle2 size={40} className="animate-bounce" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Sequence Dispatched</p>
          </div>
        ) : (
          <div className="space-y-8 relative z-10">
             <div className="flex gap-2">
              {['info', 'warning', 'success'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                    type === t
                      ? t === 'info' ? 'bg-blue-600 text-white border-blue-400/30'
                        : t === 'warning' ? 'bg-amber-600 text-white border-amber-400/30'
                        : 'bg-emerald-600 text-white border-emerald-400/30'
                      : 'bg-slate-900/50 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
                  }`}>{t}</button>
              ))}
            </div>
            
            <div className="space-y-4">
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="PROTOCOL SUBJECT"
                className="w-full input-auth italic font-bold tracking-widest placeholder-slate-700 uppercase" />
              
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="CORE MESSAGE CONTENT..." rows={4}
                className="w-full bg-slate-900/50 border border-white/[0.05] focus:border-blue-500/40 rounded-2xl px-6 py-4 text-xs text-white placeholder-slate-700 outline-none transition-all resize-none italic font-medium" />
            </div>

            <button onClick={send} disabled={sending || !subject.trim() || !message.trim()}
              className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.4em] transition-all disabled:opacity-30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-3 relative z-10">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {sending ? 'Processing...' : 'Execute Dispatch'}
              </div>
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
        <div className="flex items-center justify-between mb-10 relative z-10">
          <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
            <Sliders size={16} className="text-purple-500" /> Resource Control
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
        </div>

        <div className="space-y-8 mb-10 relative z-10">
          <div>
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-3 ml-2 flex items-center gap-2">
               <Zap size={10} /> Allocation (GB)
            </label>
            <input type="number" min="0.1" step="0.5" value={storageGB} onChange={e => setStorageGB(e.target.value)}
              className="w-full input-auth font-mono text-center tracking-[0.2em]" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-3 ml-2 flex items-center gap-2">
               <Zap size={10} /> Atomic Limit (MB)
            </label>
            <input type="number" min="1" step="1" value={maxFileMB} onChange={e => setMaxFileMB(e.target.value)}
              className="w-full input-auth font-mono text-center tracking-[0.2em]" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] block mb-3 ml-2">Strategic Memo</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Internal observations..."
              className="w-full bg-slate-900/50 border border-white/[0.05] focus:border-purple-500/40 rounded-[1.5rem] px-6 py-4 text-xs text-white outline-none transition-all resize-none italic font-medium" />
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-purple-900/40 group overflow-hidden relative">
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="flex items-center gap-3 relative z-10">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {saving ? 'Synchronizing...' : 'Apply Overrides'}
          </div>
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
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 backdrop-blur-2xl bg-slate-950/60" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.8 }}
        className="glass-auth w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-white/[0.1] shadow-[0_0_100px_rgba(0,0,0,0.6)] rounded-[3rem]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 bg-slate-900/40 border-b border-white/[0.05] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.02] to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-6 min-w-0 relative z-10">
            <div className="h-12 w-12 rounded-[1.25rem] bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20 shrink-0 shadow-lg shadow-blue-500/5">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-black text-white italic truncate tracking-tight">{file.filename}</h4>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1.5 opacity-60">
                Diagnostic: {formatBytes(file.size)} · {file.contentType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 relative z-10">
            <a href={url} target="_blank" rel="noopener noreferrer" className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all" title="External Hub"><ExternalLink size={20} /></a>
            <a href={url} download={file.filename} className="p-3 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-2xl transition-all" title="Archive Unit"><Download size={20} /></a>
            <div className="w-px h-8 bg-white/[0.05] mx-2" />
            <button onClick={onClose} className="p-3 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"><X size={22} /></button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950/80 overflow-auto flex items-center justify-center p-12 min-h-[400px] relative">
          {isImage && <img src={url} alt={file.filename} className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/[0.05]" />}
          {isVideo && <video src={url} controls autoPlay className="max-w-full max-h-full rounded-2xl w-full h-full shadow-2xl" />}
          {isAudio && (
             <div className="flex flex-col items-center gap-10">
                <div className="h-28 w-28 rounded-[2.5rem] bg-indigo-600/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-2xl">
                   <Music size={48} className="animate-pulse" />
                </div>
                <audio src={url} controls className="w-80 h-10 invert brightness-200 contrast-200" />
             </div>
          )}
          {isPdf && <iframe src={url} title={file.filename} className="w-full h-[70vh] border-0 rounded-2xl shadow-inner bg-white/5" />}
          {!isImage && !isVideo && !isAudio && !isPdf && (
            <div className="text-center space-y-8 py-10">
               <div className="h-28 w-28 mx-auto rounded-[2.5rem] bg-slate-900/60 flex items-center justify-center text-slate-700 border border-white/[0.03] shadow-inner">
                  <ShieldAlert size={56} />
               </div>
               <div>
                  <p className="text-white font-black uppercase tracking-[0.4em] text-[11px] italic">Preview Protocol Restricted</p>
                  <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mt-3 opacity-60">Asset Format incompatible with neural reconstruction</p>
               </div>
               <a href={url} download={file.filename} className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                  <Download size={14} /> Download for Manual Analysis
               </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
