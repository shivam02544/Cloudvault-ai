import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Cloud, Download, ExternalLink, FileQuestion, Loader2, AlertTriangle, Music } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getCategory = (contentType, filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  const mime = contentType?.toLowerCase() || '';
  if (mime.startsWith('image/') || ['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return 'image';
  if (mime.startsWith('video/') || ['mp4','mov','webm','avi','mkv'].includes(ext)) return 'video';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('audio/') || ['mp3','wav','ogg','flac'].includes(ext)) return 'audio';
  return 'other';
};

export default function PublicFilePage() {
  const { sharingId } = useParams();
  const [data, setData] = useState(null);   // { url, filename, size, contentType }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!sharingId) { setError('Invalid link'); setLoading(false); return; }
    axios.get(`${API_URL}/s/${sharingId}`)
      .then(r => setData(r.data))
      .catch(e => {
        const msg = e.response?.data?.error;
        setError(msg === 'File not found' ? 'This file no longer exists or the link has expired.'
          : msg === 'This file is private' ? 'This file is private and cannot be accessed.'
          : 'Failed to load file. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [sharingId]);

  const category = data ? getCategory(data.contentType, data.filename) : null;

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-blue-600/6 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-purple-600/6 blur-[100px]" />
      </div>

      {/* Minimal header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#080d1a]/80 backdrop-blur-xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cloud className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            CloudVault AI
          </span>
        </div>
        <span className="text-xs text-slate-500">Shared file</span>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 py-8 sm:py-12">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-slate-500 text-sm">Loading file…</p>
          </div>
        ) : error ? (
          <div className="w-full max-w-md">
            <div className="glass p-8 rounded-2xl border border-rose-500/20 text-center">
              <div className="h-14 w-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400 mx-auto mb-4">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h2 className="text-white font-bold mb-2">File Unavailable</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        ) : data ? (
          <div className="w-full max-w-3xl">
            {/* File info bar */}
            <div className="glass rounded-2xl border border-white/[0.07] p-4 mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{data.filename}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatBytes(data.size)} · {data.contentType}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={data.url} download={data.filename}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 transition-all">
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
                <a href={data.url} target="_blank" rel="noopener noreferrer"
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-white/[0.06] transition-all" title="Open raw file">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Viewer */}
            <div className="glass rounded-2xl border border-white/[0.07] overflow-hidden">
              {category === 'image' && (
                <div className="flex items-center justify-center bg-slate-950/40 p-4 min-h-[300px]">
                  <img src={data.url} alt={data.filename} className="max-w-full max-h-[70vh] object-contain rounded-xl" />
                </div>
              )}
              {category === 'video' && (
                <div className="bg-black">
                  <video src={data.url} controls autoPlay className="w-full max-h-[70vh]">
                    <source src={data.url} type={data.contentType} />
                  </video>
                </div>
              )}
              {category === 'audio' && (
                <div className="flex flex-col items-center gap-5 p-10 bg-slate-950/30">
                  <div className="h-20 w-20 bg-purple-500/10 rounded-3xl flex items-center justify-center text-purple-400 border border-purple-500/15">
                    <Music className="h-10 w-10" />
                  </div>
                  <p className="text-slate-300 font-medium text-sm">{data.filename}</p>
                  <audio src={data.url} controls autoPlay className="w-full max-w-sm">
                    <source src={data.url} type={data.contentType} />
                  </audio>
                </div>
              )}
              {category === 'pdf' && (
                <iframe src={`${data.url}#toolbar=1`} title={data.filename} className="w-full h-[75vh] border-0" />
              )}
              {category === 'other' && (
                <div className="flex flex-col items-center gap-4 p-12 text-center bg-slate-950/30">
                  <div className="h-16 w-16 bg-slate-800/60 rounded-2xl flex items-center justify-center text-slate-500">
                    <FileQuestion className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-200">Preview not available</p>
                    <p className="text-slate-500 text-sm mt-1">{data.contentType} cannot be previewed in the browser.</p>
                  </div>
                  <a href={data.url} download={data.filename}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">
                    <Download className="h-4 w-4" /> Download file
                  </a>
                </div>
              )}
            </div>

            <p className="text-center text-xs text-slate-600 mt-4">
              Shared via <span className="text-slate-500">CloudVault AI</span>
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
