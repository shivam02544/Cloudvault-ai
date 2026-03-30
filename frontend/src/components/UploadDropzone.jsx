import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, AlertCircle, X } from 'lucide-react';
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
    ? 'border-blue-400 bg-blue-500/10'
    : isDragReject ? 'border-rose-400 bg-rose-500/10'
    : 'border-white/[0.08] hover:border-blue-500/40 hover:bg-white/[0.02]';

  const iconClass = isDragActive && !isDragReject
    ? 'bg-blue-500/20 text-blue-400 scale-110'
    : isDragReject ? 'bg-rose-500/15 text-rose-400'
    : 'bg-slate-800/70 text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-400';

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`glass group relative border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${zoneClass} ${uploading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-8 px-4 sm:py-12 text-center">
          <div className={`mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl transition-all duration-300 ${iconClass}`}>
            <UploadCloud className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          {isDragReject ? (
            <p className="text-base font-medium text-rose-400">File too large or unsupported</p>
          ) : isDragActive ? (
            <p className="text-lg font-semibold text-blue-400">Drop to upload</p>
          ) : (
            <>
              <p className="text-sm sm:text-base font-semibold text-slate-200">Drag & drop your file here</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                or <span className="text-blue-400 font-medium">tap to browse</span>
              </p>
              <p className="text-[11px] text-slate-600 mt-3">All file types · Max 1 GB</p>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      {uploading && (
        <div className="mt-3 glass rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 truncate max-w-[70%]">{uploadedName}</span>
            <span className="text-xs font-mono font-semibold text-blue-400 shrink-0 ml-2">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Success */}
      {success && !uploading && (
        <div className="mt-3 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm">Upload complete</p>
            <p className="text-xs text-emerald-500/70 truncate">{uploadedName}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 flex items-start justify-between gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-xl">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-1 rounded-md hover:bg-rose-500/20 transition-colors shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;
