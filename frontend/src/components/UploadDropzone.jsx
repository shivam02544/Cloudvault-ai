import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
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
    ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.1)]'
    : isDragReject ? 'border-rose-500/50 bg-rose-500/10'
    : 'border-white/[0.05] hover:border-blue-500/30 hover:bg-white/[0.01]';

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`glass-premium group relative border-2 border-dashed rounded-[2rem] sm:rounded-[2.5rem] cursor-pointer transition-all duration-500 overflow-hidden ${zoneClass} ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:-translate-y-1 active:scale-[0.98]'}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center py-10 sm:py-12 px-6 sm:px-8 text-center relative z-20">
          <div className={`mb-4 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl sm:rounded-[1.5rem] transition-all duration-500 border ${
            isDragActive ? 'bg-blue-600/20 border-blue-400 text-white shadow-lg scale-110' : 
            isDragReject ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
            'bg-slate-900 border-white/[0.05] text-slate-500 group-hover:text-blue-400 group-hover:border-blue-500/30 shadow-inner'
          }`}>
            {uploading ? <Loader2 size={24} className="animate-spin sm:size-[28px]" /> : <UploadCloud size={24} className="sm:size-[28px]" />}
          </div>
          
          {isDragReject ? (
            <p className="text-[12px] sm:text-sm font-black text-rose-400 uppercase tracking-[0.2em] animate-in fade-in slide-in-from-bottom-2">Invalid File Type or Size</p>
          ) : isDragActive ? (
            <p className="text-[12px] sm:text-sm font-black text-blue-400 uppercase tracking-[0.2em] animate-pulse">Release to Upload</p>
          ) : (
            <div className="animate-in fade-in duration-500">
              <p className="text-[12px] sm:text-sm font-black text-slate-200 uppercase tracking-[0.2em]">Drag & Drop Files here</p>
              <p className="text-[9px] sm:text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-[0.3em] opacity-60">
                 tap to <span className="text-blue-500">browse files</span>
              </p>
              <div className="flex items-center gap-4 mt-6 justify-center">
                 <span className="h-px w-6 sm:w-8 bg-white/[0.05]" />
                 <span className="text-[8px] sm:text-[9px] font-black text-slate-600 uppercase tracking-widest whitespace-nowrap">MAX LIMIT 1024 MB</span>
                 <span className="h-px w-6 sm:w-8 bg-white/[0.05]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      {uploading && (
        <div className="mt-4 sm:mt-6 glass-premium rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 border border-white/[0.05] animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-ping" />
              <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] truncate max-w-[150px] sm:max-w-none">{uploadedName}</span>
            </div>
            <span className="text-[10px] sm:text-xs font-black text-blue-400 tracking-widest">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden shadow-inner border border-white/5">
            <div 
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 rounded-full transition-all duration-300" 
            />
          </div>
        </div>
      )}

      {/* Success */}
      {success && !uploading && (
        <div className="mt-4 sm:mt-6 flex items-center gap-4 glass-premium border border-emerald-500/20 text-emerald-400 px-5 sm:px-6 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] animate-in fade-in zoom-in-95">
          <div className="h-9 w-9 sm:h-10 sm:w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
             <CheckCircle size={18} className="sm:size-[20px]" />
          </div>
          <div className="min-w-0">
            <p className="font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em]">Upload Complete</p>
            <p className="text-[9px] text-emerald-500/50 truncate font-mono uppercase mt-1">{uploadedName}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 sm:mt-6 flex items-start justify-between gap-4 glass-premium border border-rose-500/20 text-rose-400 px-5 sm:px-6 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] animate-in fade-in slide-in-from-left-4">
          <div className="flex items-start gap-4">
             <div className="h-9 w-9 sm:h-10 sm:w-10 bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
                <AlertCircle size={18} className="sm:size-[20px]" />
             </div>
             <div>
                <p className="font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mb-1">Upload Error</p>
                <p className="text-[9px] leading-relaxed font-bold uppercase tracking-tight opacity-70">{error}</p>
             </div>
          </div>
          <button onClick={() => setError(null)} className="p-2 rounded-xl hover:bg-rose-500/10 transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;
