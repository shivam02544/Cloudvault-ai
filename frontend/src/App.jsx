import React, { useState } from 'react';
import Navbar from './components/Navbar';
import UploadDropzone from './components/UploadDropzone';
import {
  HardDrive, FilePlus, FolderOpen,
  LayoutGrid, List as ListIcon, Image, FileText, File
} from 'lucide-react';

// Render an icon based on MIME type
const FileIcon = ({ type, className }) => {
  if (type?.startsWith('image/')) return <Image className={className} />;
  if (type === 'application/pdf') return <FileText className={className} />;
  return <File className={className} />;
};

const CATEGORIES = ['All Files', 'Images', 'PDFs'];

function App() {
  const [files, setFiles] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [activeCategory, setActiveCategory] = useState('All Files');

  const handleUploadSuccess = (fileData) => {
    setFiles((prev) => [
      {
        id: fileData.fileId,
        name: fileData.name,
        key: fileData.key,
        contentType: fileData.contentType,
        uploadedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const filteredFiles = files.filter((f) => {
    if (activeCategory === 'Images') return f.contentType?.startsWith('image/');
    if (activeCategory === 'PDFs') return f.contentType === 'application/pdf';
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-animated">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              My Vault
            </h1>
            <p className="text-slate-500 mt-1.5 flex items-center gap-1.5 text-sm">
              <HardDrive className="h-3.5 w-3.5" />
              Free Tier · Storage optimized
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 glass rounded-xl">
            <button
              id="view-grid"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              id="view-list"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              aria-label="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="mb-12">
          <UploadDropzone onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Section Header: Recent Files */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-300 flex items-center gap-2">
            <FilePlus className="h-4 w-4 text-purple-400" />
            Recent Files
          </h2>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                id={`cat-${cat.toLowerCase().replace(' ', '-')}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-500 border border-slate-700/60 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="text-xs text-slate-700 ml-1">
              {filteredFiles.length} {filteredFiles.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {/* File Grid / List */}
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-700/40 rounded-2xl">
            <div className="h-14 w-14 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-700 mb-4">
              <FolderOpen className="h-7 w-7" />
            </div>
            <p className="text-slate-500 font-medium text-sm">No files yet</p>
            <p className="text-slate-700 text-xs mt-1">Upload a file above to get started</p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
                : 'space-y-2.5'
            }
          >
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`glass group relative transition-all duration-200 hover:glow-blue ${
                  viewMode === 'grid'
                    ? 'p-5 flex flex-col cursor-default'
                    : 'px-5 py-3.5 flex items-center gap-4 cursor-default'
                }`}
              >
                {/* File icon */}
                <div
                  className={`flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 shrink-0 ${
                    viewMode === 'grid' ? 'h-11 w-11 mb-4' : 'h-9 w-9'
                  }`}
                >
                  <FileIcon
                    type={file.contentType}
                    className={viewMode === 'grid' ? 'h-5 w-5' : 'h-4 w-4'}
                  />
                </div>

                {/* File metadata */}
                <div className="min-w-0 flex-1">
                  <h3
                    className="text-sm font-medium text-slate-200 truncate"
                    title={file.name}
                  >
                    {file.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* List-mode trailing label */}
                {viewMode === 'list' && (
                  <span className="text-xs text-slate-700 shrink-0">Uploaded</span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
