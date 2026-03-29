import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle, AlertCircle, X, FileImage, FileText } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Phase 2 constraints (documented in DECISIONS.md)
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
};
const ACCEPTED_LABELS = 'JPG, PNG, WEBP, PDF';

const UploadDropzone = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadedName, setUploadedName] = useState('');

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    // Handle rejections from react-dropzone (type/size)
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      const code = rejection.errors[0]?.code;
      if (code === 'file-too-large') {
        setError('File exceeds the 2MB limit. Please choose a smaller file.');
      } else if (code === 'file-invalid-type') {
        setError(`Unsupported file type. Accepted: ${ACCEPTED_LABELS}`);
      } else {
        setError('File rejected. Please check the file and try again.');
      }
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);
    setUploadedName(file.name);

    try {
      // Step 1: Request pre-signed URL from API (→ 10% progress)
      setProgress(10);
      const res = await axios.post(`${API_URL}/files/upload-url`, {
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });

      const { uploadUrl, fileId, key } = res.data;
      setProgress(30);

      // Step 2: Upload directly to S3 with real Axios progress tracking
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (evt) => {
          const pct = Math.round((evt.loaded * 100) / evt.total);
          // Scale: 30% (after URL fetch) → 100%
          setProgress(30 + Math.round(pct * 0.7));
        },
      });

      setProgress(100);
      setSuccess(true);

      // Confirm upload — write metadata to DynamoDB (Phase 3)
      // Called ONLY after confirmed S3 PUT success (DECISIONS.md)
      // Failure is non-fatal: file is safely in S3, metadata write failed silently
      try {
        await axios.post(`${API_URL}/files/confirm`, {
          fileId,
          key,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });
      } catch (confirmErr) {
        console.error('Metadata confirm failed (non-fatal):', confirmErr);
      }

      if (onUploadSuccess) {
        onUploadSuccess({ fileId, name: file.name, key, contentType: file.type, size: file.size });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.error ||
          (err.message === 'Network Error'
            ? 'Cannot reach the server. Is the backend running?'
            : `Upload failed: ${err.message}`)
      );
    } finally {
      setUploading(false);
      setTimeout(() => {
        setProgress(0);
        setSuccess(false);
      }, 4000);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: uploading,
  });

  // Derive drop zone visual state
  const dropzoneStateClass = isDragActive && !isDragReject
    ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
    : isDragReject
    ? 'border-red-400 bg-red-500/10'
    : 'border-slate-600/60 hover:border-blue-500/40 hover:bg-white/[0.02]';

  const iconStateClass = isDragActive && !isDragReject
    ? 'bg-blue-500/20 text-blue-400 scale-110'
    : isDragReject
    ? 'bg-red-500/15 text-red-400'
    : 'bg-slate-800/70 text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-400';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`glass group relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ${dropzoneStateClass}
          ${uploading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />

        {/* Animated upload icon */}
        <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl
          transition-all duration-300 ${iconStateClass}`}>
          <UploadCloud className="h-10 w-10" />
        </div>

        {isDragReject ? (
          <p className="text-lg font-medium text-red-400">File type not supported</p>
        ) : isDragActive ? (
          <p className="text-xl font-semibold text-blue-400">Drop to upload</p>
        ) : (
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-100">
              Drag & drop your file here
            </p>
            <p className="text-sm text-slate-400">
              or <span className="text-blue-400 font-medium hover:underline">click to browse</span>
            </p>
            <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <FileImage className="h-3 w-3" /> {ACCEPTED_LABELS}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/70 px-3 py-1.5 rounded-lg border border-slate-700/50">
                <FileText className="h-3 w-3" /> Max 2 MB
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div className="mt-4 glass rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2 text-slate-300">
            <span className="truncate max-w-[220px] text-slate-400" title={uploadedName}>
              {uploadedName}
            </span>
            <span className="font-mono font-semibold text-blue-400 shrink-0 ml-2">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="relative h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2">Uploading directly to S3…</p>
        </div>
      )}

      {/* Success State */}
      {success && !uploading && (
        <div className="mt-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm">Upload complete!</p>
            <p className="text-xs text-emerald-500/70 mt-0.5 truncate">{uploadedName}</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 flex items-start justify-between gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          <div className="flex items-start gap-3 min-w-0">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded-md hover:bg-red-500/20 transition-colors shrink-0"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadDropzone;
