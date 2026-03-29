---
phase: 2
plan: 2
wave: 1
---

# Plan 2.2: UploadDropzone — Validation, Constraints & Premium States

## Objective
Upgrade `UploadDropzone.jsx` to enforce the Phase 2 decisions: 2MB limit, jpg/png/webp/pdf only, real Axios progress bar (not simulated), and fully polished upload states (idle, drag-over, uploading, success, error) using the glassmorphism system from Plan 2.1.

## Context
- `frontend/src/components/UploadDropzone.jsx` — existing component (uses `maxSize: 10485760`, no type guard)
- `.gsd/DECISIONS.md` — decisions: 2MB max, jpg/png/webp/pdf, Axios `onUploadProgress`, glassmorphism
- `frontend/src/index.css` — `.glass`, `.glow-blue` now available (from Plan 2.1)
- `frontend/src/App.jsx` — calls `<UploadDropzone onUploadSuccess={handleUploadSuccess} />`; prop interface must not change

## Tasks

<task type="auto">
  <name>Overhaul UploadDropzone with constraints and premium UX states</name>
  <files>frontend/src/components/UploadDropzone.jsx</files>
  <action>
    Replace the entire file content with the following implementation:

    ```jsx
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
          // Step 1: Request pre-signed URL from API (10% progress)
          setProgress(10);
          const res = await axios.post(`${API_URL}/files/upload-url`, {
            filename: file.name,
            contentType: file.type,
            size: file.size,
          });

          const { uploadUrl, fileId, key } = res.data;
          setProgress(30);

          // Step 2: Upload directly to S3 with real progress tracking
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
          if (onUploadSuccess) onUploadSuccess({ fileId, name: file.name, key });
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

      // Derive border/background state
      const dropzoneClass = [
        'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer',
        'transition-all duration-300 group',
        isDragActive && !isDragReject
          ? 'border-blue-400 bg-blue-500/10 scale-[1.01] glow-blue'
          : isDragReject
          ? 'border-red-400 bg-red-500/10'
          : 'border-slate-600/60 hover:border-blue-500/50 hover:bg-white/[0.02]',
        uploading ? 'opacity-60 cursor-not-allowed pointer-events-none' : '',
      ].filter(Boolean).join(' ');

      return (
        <div className="w-full max-w-2xl mx-auto">
          {/* Drop Zone */}
          <div {...getRootProps()} className={`glass ${dropzoneClass}`}>
            <input {...getInputProps()} />

            {/* Animated icon */}
            <div className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300
              ${isDragActive && !isDragReject ? 'bg-blue-500/20 text-blue-400 scale-110' : isDragReject ? 'bg-red-500/20 text-red-400' : 'bg-slate-800/60 text-slate-400 group-hover:bg-blue-500/10 group-hover:text-blue-400'}`}>
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
                <p className="text-sm text-slate-400">or <span className="text-blue-400 font-medium hover:underline">click to browse</span></p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800/60 px-2 py-1 rounded-md">
                    <FileImage className="h-3 w-3" /> {ACCEPTED_LABELS}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-800/60 px-2 py-1 rounded-md">
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
                <span className="truncate max-w-[200px]" title={uploadedName}>
                  {uploadedName}
                </span>
                <span className="font-mono font-semibold text-blue-400">{Math.round(progress)}%</span>
              </div>
              <div className="relative h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Uploading directly to S3…</p>
            </div>
          )}

          {/* Success State */}
          {success && !uploading && (
            <div className="mt-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Upload complete!</p>
                <p className="text-xs text-emerald-500/80 mt-0.5 truncate">{uploadedName}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mt-4 flex items-start justify-between gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
              <div className="flex items-center gap-3">
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
    ```

    Key changes from original:
    - `maxSize` changed from 10MB → 2MB
    - `accept` added (jpg/png/webp/pdf only)
    - `multiple: false` enforced
    - Rejection handled via `rejectedFiles` with human-readable messages
    - Progress starts at 10% (URL fetch), scales 30→100% during S3 upload
    - `isDragReject` state shows red UI when dragging wrong type
    - `.glass` class applied to dropzone and progress panel
    - Success shows filename + tick
    - Error is non-harsh and dismissible
  </action>
  <verify>
    1. Open the frontend at http://localhost:5173
    2. Drag a large file to the dropzone — should show "File exceeds 2MB limit" in red
    3. Drag an unsupported type (e.g., .mp4) — should show "Unsupported file type"
    4. Drag a valid jpg/pdf under 2MB — progress bar should animate to 100%
  </verify>
  <done>
    - Dropzone shows type/size badges
    - isDragReject triggers red border
    - Valid file triggers animated progress bar from 10 → 100%
    - Success banner showing filename appears
    - Error is dismissible
  </done>
</task>

## Success Criteria
- [ ] Files > 2MB are rejected with friendly message
- [ ] Files of wrong type (e.g., .mp4, .gif) are rejected with friendly message
- [ ] Valid files trigger Axios upload with real `onUploadProgress` bar
- [ ] Success state shows filename and green check
- [ ] Error state is dismissible
