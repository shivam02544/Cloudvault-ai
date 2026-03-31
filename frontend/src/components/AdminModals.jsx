import { X, Bell, Send, Loader2, CheckCircle2, Sliders, Download, ExternalLink, FileQuestion } from 'lucide-react';
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-md bg-black/60" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass w-full max-w-md p-8 border border-white/[0.08] shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Bell size={14} className="text-blue-400" /> Dispatch Notification
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {sent ? (
          <div className="py-12 flex flex-col items-center gap-4 text-emerald-400">
            <CheckCircle2 size={48} className="animate-bounce" />
            <p className="text-xs font-black uppercase tracking-widest">Notification Dispatched</p>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="flex gap-2">
              {['info', 'warning', 'success'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                    type === t
                      ? t === 'info' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : t === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10'
                  }`}>{t}</button>
              ))}
            </div>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject Header"
              className="w-full bg-slate-950/40 border border-white/[0.05] focus:border-blue-500/30 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none transition-all" />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message Content..." rows={4}
              className="w-full bg-slate-950/40 border border-white/[0.05] focus:border-blue-500/30 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 outline-none transition-all resize-none" />
            <button onClick={send} disabled={sending || !subject.trim() || !message.trim()}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Processing...' : 'Execute Dispatch'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 backdrop-blur-md bg-black/60" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass w-full max-w-sm p-8 border border-white/[0.08] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Sliders size={14} className="text-purple-400" /> Resource Control
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Storage Allocation (GB)</label>
            <input type="number" min="0.1" step="0.5" value={storageGB} onChange={e => setStorageGB(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/[0.05] focus:border-purple-500/30 rounded-2xl px-4 py-3 text-xs text-white outline-none transition-all font-mono" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Atomic Limit (MB)</label>
            <input type="number" min="1" step="1" value={maxFileMB} onChange={e => setMaxFileMB(e.target.value)}
              className="w-full bg-slate-950/40 border border-white/[0.05] focus:border-purple-500/30 rounded-2xl px-4 py-3 text-xs text-white outline-none transition-all font-mono" />
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5 ml-1">Strategic Memo</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Internal observations..."
              className="w-full bg-slate-950/40 border border-white/[0.05] focus:border-purple-500/30 rounded-2xl px-4 py-3 text-xs text-white outline-none transition-all resize-none" />
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {saving ? 'Synchronizing...' : 'Apply Overrides'}
        </button>
      </motion.div>
    </div>
  );
};

export const AdminPreviewModal = ({ file, url, onClose }) => {
  if (!file || !url) return null;
  const isImage = file.contentType?.startsWith('image/');
  const isVideo = file.contentType?.startsWith('video/');
  const isAudio = file.contentType?.startsWith('audio/');
  const isPdf = file.contentType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/[0.1] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/[0.05]">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shrink-0">
              <FileQuestion size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">{file.filename}</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{formatBytes(file.size)} · {file.contentType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={url} target="_blank" rel="noopener noreferrer" className="p-2.5 text-slate-400 hover:text-white transition-colors" title="Open Edge"><ExternalLink size={18} /></a>
            <a href={url} download={file.filename} className="p-2.5 text-slate-400 hover:text-blue-400 transition-colors" title="Download"><Download size={18} /></a>
            <button onClick={onClose} className="p-2.5 text-slate-500 hover:text-white transition-colors ml-2"><X size={20} /></button>
          </div>
        </div>

        <div className="flex-1 bg-black/40 overflow-auto flex items-center justify-center p-8 min-h-[300px]">
          {isImage && <img src={url} alt={file.filename} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />}
          {isVideo && <video src={url} controls autoPlay className="max-w-full max-h-full rounded-xl w-full" />}
          {isAudio && (
             <div className="flex flex-col items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20"><FileQuestion size={32} /></div>
                <audio src={url} controls className="w-64" />
             </div>
          )}
          {isPdf && <iframe src={url} title={file.filename} className="w-full h-[60vh] border-0 rounded-xl" />}
          {!isImage && !isVideo && !isAudio && !isPdf && (
            <div className="text-center space-y-4">
               <div className="h-20 w-20 mx-auto rounded-3xl bg-slate-800/40 flex items-center justify-center text-slate-600"><X size={48} /></div>
               <div>
                  <p className="text-slate-200 font-bold uppercase tracking-[0.2em] text-[10px]">Preview Protocol Unavailable</p>
                  <p className="text-slate-500 text-xs mt-2 italic">Format: {file.contentType}</p>
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
