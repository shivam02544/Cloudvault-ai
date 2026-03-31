import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, AlertCircle, X, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_SIZE = 1024 * 1024 * 1024;

const UploadDropzone = ({ onUploadSuccess, token }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadedName, setUploadedName] = useState('');

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const code = rejectedFiles[0].errors[0]?.code;
      setError(code === 'file-too-large' ? 'File exceeds the 1 GB limit.' : 'File rejected. Please try again.');
      return;
    }
    if (!acceptedFiles.length) return;

    const file = acceptedFiles[0];
    setUploading(true); setProgress(0); setError(null); setSuccess(false);
    setUploadedName(file.name);

    try {
      setProgress(10);
      const res = await axios.post(`${API_URL}/files/upload-url`,
        { filename: file.name, contentType: file.type, size: file.size },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { uploadUrl, fileId, key } = res.data;
      setProgress(30);

      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (evt) => setProgress(30 + Math.round((evt.loaded / evt.total) * 70)),
      });

      setProgress(100); setSuccess(true);

      try {
        await axios.post(`${API_URL}/files/confirm`,
          { fileId, key, filename: file.name, contentType: file.type, size: file.size },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) { console.error('Confirm failed (non-fatal):', e); }

      onUploadSuccess?.({ fileId, name: file.name, key, contentType: file.type, size: file.size });
    } catch (err) {
      setError(err.response?.data?.error || (err.message === 'Network Error' ? 'Cannot reach the server.' : `Upload failed: ${err.message}`));
    } finally {
      setUploading(false);
      setTimeout(() => { setProgress(0); setSuccess(false); }, 4000);
    }
  }, [onUploadSuccess, token]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, maxSize: MAX_SIZE, multiple: false, disabled: uploading,
  });

  const zoneClass = isDragActive && !isDragReject
    ? 'border-blue-500/50 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
    : isDragReject ? 'border-rose-500/50 bg-rose-500/5'
    : 'border-white/[0.05] hover:border-blue-500/30 hover:bg-white/[0.01]';

  return (
    <div className="w-full">
      <motion.div
        {...getRootProps()}
        whileHover={!uploading ? { scale: 1.01, y: -2 } : {}}
        whileTap={!uploading ? { scale: 0.99 } : {}}
        className={`glass-premium group relative border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all duration-500 overflow-hidden ${zoneClass} ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        
        {/* Hover Scan Line */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
            >
              <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-scan" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-0 bg-blue-500/[0.03] animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-center justify-center py-12 px-8 text-center relative z-20">
          <motion.div 
            animate={isDragActive ? { scale: 1.1, rotate: [0, 5, -5, 0] } : {}}
            className={`mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] transition-all duration-500 border ${
              isDragActive ? 'bg-blue-600/20 border-blue-400 text-white shadow-lg' : 
              isDragReject ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
              'bg-slate-900 border-white/[0.05] text-slate-500 group-hover:text-blue-400 group-hover:border-blue-500/30 shadow-inner'
            }`}
          >
            {uploading ? <Loader2 size={28} className="animate-spin" /> : <UploadCloud size={28} />}
          </motion.div>
          
          <AnimatePresence mode="wait">
            {isDragReject ? (
              <motion.p key="reject" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-black text-rose-400 uppercase tracking-[0.2em]">Protocol Violation: Invalid Asset</motion.p>
            ) : isDragActive ? (
              <motion.p key="active" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-black text-blue-400 uppercase tracking-[0.2em] animate-pulse">Release to Ingest Asset</motion.p>
            ) : (
              <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm font-black text-slate-200 uppercase tracking-[0.2em]">Drag & Ingest Neural Assets</p>
                <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-[0.3em] opacity-60">
                   tap to <span className="text-blue-500">browse sector</span>
                </p>
                <div className="flex items-center gap-4 mt-6 justify-center">
                   <span className="h-px w-8 bg-white/[0.05]" />
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">LIMIT 1024 MB</span>
                   <span className="h-px w-8 bg-white/[0.05]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 glass-premium rounded-[2rem] p-6 border border-white/[0.05]"
          >
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] truncate max-w-[150px]">{uploadedName}</span>
              </div>
              <span className="text-xs font-black text-blue-400 tracking-widest">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 rounded-full" 
              />
            </div>
          </motion.div>
        )}

        {/* Success */}
        {success && !uploading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 flex items-center gap-4 glass-premium border border-emerald-500/20 text-emerald-400 px-6 py-5 rounded-[2rem]"
          >
            <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
               <CheckCircle size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-black text-[10px] uppercase tracking-[0.3em]">Synapse Complete</p>
              <p className="text-[10px] text-emerald-500/50 truncate font-mono uppercase mt-1">{uploadedName}</p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mt-6 flex items-start justify-between gap-4 glass-premium border border-rose-500/20 text-rose-400 px-6 py-5 rounded-[2rem]"
          >
            <div className="flex items-start gap-4">
               <div className="h-10 w-10 bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
                  <AlertCircle size={20} />
               </div>
               <div>
                  <p className="font-black text-[10px] uppercase tracking-[0.3em] mb-1">Protocol Deviation</p>
                  <p className="text-[10px] leading-relaxed font-bold uppercase tracking-tight opacity-70">{error}</p>
               </div>
            </div>
            <button onClick={() => setError(null)} className="p-2 rounded-xl hover:bg-rose-500/10 transition-colors shrink-0">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadDropzone;
