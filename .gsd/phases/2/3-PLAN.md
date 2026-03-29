---
phase: 2
plan: 3
wave: 2
---

# Plan 2.3: App Layout — Glassmorphism Upgrade & Animated Background

## Objective
Upgrade `App.jsx` to properly use the design system established in Plan 2.1: animated gradient background, glassmorphism cards for the file grid, improved empty state, and polished category chip row. This makes the overall app feel like the premium SaaS product described in the SPEC.

## Context
- `frontend/src/App.jsx` — main layout (currently uses basic slate-800 cards)
- `frontend/src/index.css` — provides `.glass`, `.glow-blue`, `.bg-gradient-animated` (from Plan 2.1)
- `frontend/src/components/Navbar.jsx` — already well-styled, no changes needed
- `.gsd/DECISIONS.md` — UI decisions: dark mode, glassmorphism, grid layout, file preview cards

## Tasks

<task type="auto">
  <name>Upgrade App.jsx with glassmorphism layout, animated bg, and polished file grid</name>
  <files>frontend/src/App.jsx</files>
  <action>
    Replace the entire file with the following:

    ```jsx
    import React, { useState } from 'react';
    import Navbar from './components/Navbar';
    import UploadDropzone from './components/UploadDropzone';
    import {
      HardDrive, FilePlus, FolderOpen,
      LayoutGrid, List as ListIcon, Image, FileText, File
    } from 'lucide-react';

    // Map MIME type to an icon component
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

            {/* Header */}
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

              <div className="flex items-center gap-1.5 p-1 glass rounded-xl">
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

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  id={`cat-${cat.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'text-slate-400 border border-slate-700/60 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <span className="ml-auto text-xs text-slate-600">{filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}</span>
            </div>

            {/* File Grid / List */}
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-700/50 rounded-2xl bg-slate-900/20">
                <div className="h-16 w-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-600 mb-4">
                  <FolderOpen className="h-8 w-8" />
                </div>
                <p className="text-slate-400 font-medium">No files yet</p>
                <p className="text-slate-600 text-sm mt-1">Upload a file above to get started</p>
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
                        ? 'rounded-2xl p-5 flex flex-col hover:border-blue-500/30'
                        : 'rounded-xl px-5 py-3.5 flex items-center gap-4 hover:border-slate-600/60'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 shrink-0 ${
                      viewMode === 'grid' ? 'h-12 w-12 mb-4' : 'h-9 w-9'
                    }`}>
                      <FileIcon
                        type={file.contentType}
                        className={viewMode === 'grid' ? 'h-6 w-6' : 'h-4 w-4'}
                      />
                    </div>

                    {/* File info */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-sm font-medium text-slate-200 truncate"
                        title={file.name}
                      >
                        {file.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* List-mode size placeholder */}
                    {viewMode === 'list' && (
                      <span className="text-xs text-slate-600 shrink-0">Uploaded</span>
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
    ```

    Key changes:
    - Root div uses `.bg-gradient-animated` for animated radial glow
    - View toggle buttons wrapped in a `.glass` pill container
    - Category filter chips with active state
    - Empty state polished with large icon and descriptive text
    - File cards use `.glass` + `hover:glow-blue` instead of raw slate-800
    - `FileIcon` component renders contextually based on MIME type
    - `contentType` is now passed from UploadDropzone (update handlerUploadSuccess signature to accept it)

    Note: `UploadDropzone.onUploadSuccess` currently passes `{ fileId, name, key }`. We also need to extract `contentType` from the file before upload to pass it up. Add `contentType: file.type` to the object passed to `onUploadSuccess` in `UploadDropzone.jsx` (a one-line addition inside the `try` block after success).
  </action>
  <verify>
    1. Open http://localhost:5173
    2. Confirm page background has subtle blue/purple radial glow (not flat slate)
    3. Upload a .jpg — it appears in the grid with an Image icon
    4. Upload a .pdf — it appears with a FileText icon
    5. Click category chips — filtering works
    6. Toggle grid/list view — layout switches cleanly
  </verify>
  <done>
    - `bg-gradient-animated` visible on page background
    - File cards use glassmorphism (frosted look with border)
    - Category filter chips functional
    - FileIcon renders correctly by type
    - Empty state shows placeholder icon + copy
  </done>
</task>

## Success Criteria
- [ ] Page background uses animated radial gradient (not flat)
- [ ] File cards use `.glass` class (frosted glass look)
- [ ] Category filter chips work correctly
- [ ] Uploaded images show Image icon, PDFs show FileText icon
- [ ] Switching grid ↔ list view works without errors
- [ ] Empty state shown when no files present
