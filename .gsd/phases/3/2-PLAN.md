---
phase: 3
plan: 2
wave: 2
---

# Plan 3.2: Frontend — Confirm Upload + Dashboard Fetch + Loading State

## Objective
Wire the frontend to the two new backend endpoints: `POST /files/confirm` (called from `UploadDropzone` after S3 success) and `GET /files` (called once on mount in `App.jsx`). Add a loading spinner while the file list is fetching, and an empty state when the list is empty.

## Context
- `frontend/src/components/UploadDropzone.jsx` — must call `POST /files/confirm` AFTER successful S3 PUT
- `frontend/src/App.jsx` — must call `GET /files` once on mount via `useEffect`, manage `loading` state
- `.gsd/DECISIONS.md` Phase 3:
  - `POST /files/confirm` called only after confirmed S3 success
  - `GET /files` called once on mount (no polling)
  - Loading spinner shown while fetch in-flight
  - Empty state shown when `files.length === 0` and not loading
  - Confirm failure handled gracefully (show error, don't crash)

## Tasks

<task type="auto">
  <name>Call POST /files/confirm in UploadDropzone after successful S3 upload</name>
  <files>frontend/src/components/UploadDropzone.jsx</files>
  <action>
    In the existing `onDrop` handler, AFTER `setProgress(100); setSuccess(true);`, add a call to confirm the upload:

    Find this existing block (around line 68-73):
    ```javascript
    setProgress(100);
    setSuccess(true);
    if (onUploadSuccess) {
      onUploadSuccess({ fileId, name: file.name, key, contentType: file.type });
    }
    ```

    Replace with:
    ```javascript
    setProgress(100);
    setSuccess(true);

    // Confirm upload — write metadata to DynamoDB (Phase 3)
    // Only called AFTER confirmed S3 PUT success (DECISIONS.md)
    try {
      await axios.post(`${API_URL}/files/confirm`, {
        fileId,
        key,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      });
    } catch (confirmErr) {
      // Confirm failure is non-fatal — file is in S3, metadata write failed
      // Log it, but don't override the upload success state
      console.error('Metadata confirm failed:', confirmErr);
    }

    if (onUploadSuccess) {
      onUploadSuccess({ fileId, name: file.name, key, contentType: file.type, size: file.size });
    }
    ```

    Key rules:
    - The `/files/confirm` call is inside its OWN try/catch — a failure does NOT set `setError()` or override the success state
    - It is called ONLY inside the outer `try` block, after `setProgress(100)` (meaning S3 upload was successful)
    - `size: file.size` is now also passed to `onUploadSuccess`
  </action>
  <verify>After a successful upload, browser Network tab shows a `POST /files/confirm` request with status 200 (when backend is deployed) or a failed attempt that does NOT break the success UI.</verify>
  <done>
    - `POST /files/confirm` called after S3 success
    - Confirm failure is caught silently — success banner still shows
    - `size` added to onUploadSuccess payload
  </done>
</task>

<task type="auto">
  <name>Add GET /files fetch on mount + loading spinner + empty state in App.jsx</name>
  <files>frontend/src/App.jsx</files>
  <action>
    Make the following targeted changes to `App.jsx`:

    1. **Add `useEffect` import** (it's currently not imported — add it):
       Change: `import React, { useState } from 'react';`
       To: `import React, { useState, useEffect } from 'react';`

    2. **Add `Loader2` to the lucide-react import** (for the spinner icon):
       Change: `import { HardDrive, FilePlus, FolderOpen, LayoutGrid, List as ListIcon, Image, FileText, File } from 'lucide-react';`
       To: `import { HardDrive, FilePlus, FolderOpen, LayoutGrid, List as ListIcon, Image, FileText, File, Loader2 } from 'lucide-react';`

    3. **Add `loading` state** in the App function alongside the existing state:
       After: `const [activeCategory, setActiveCategory] = useState('All Files');`
       Add: `const [loading, setLoading] = useState(true);`

    4. **Add `useEffect` to fetch files on mount** (after the state declarations):
       ```javascript
       useEffect(() => {
         const fetchFiles = async () => {
           try {
             const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/files`);
             if (!res.ok) throw new Error(`HTTP ${res.status}`);
             const data = await res.json();
             setFiles(data.files || []);
           } catch (err) {
             console.error('Failed to fetch files:', err);
             // Non-fatal — dashboard shows empty state
           } finally {
             setLoading(false);
           }
         };
         fetchFiles();
       }, []); // Empty deps — fetch once on mount only (DECISIONS.md Phase 3)
       ```

    5. **Update `handleUploadSuccess`** to also accept `size`:
       Change: `id: fileData.fileId,` block in `handleUploadSuccess` to add `size`:
       ```javascript
       const handleUploadSuccess = (fileData) => {
         setFiles((prev) => [
           {
             id: fileData.fileId,
             fileId: fileData.fileId,
             name: fileData.name,
             filename: fileData.name,
             key: fileData.key,
             contentType: fileData.contentType,
             size: fileData.size || 0,
             uploadedAt: new Date().toISOString(),
           },
           ...prev,
         ]);
       };
       ```

    6. **Add loading spinner** — replace the existing empty state conditional block:
       The current structure is `if (filteredFiles.length === 0) { ... empty state ... }`.
       Replace with:
       ```jsx
       {loading ? (
         <div className="flex flex-col items-center justify-center py-24">
           <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-4" />
           <p className="text-slate-500 text-sm">Loading your files…</p>
         </div>
       ) : filteredFiles.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-24 border border-dashed border-slate-700/40 rounded-2xl">
           <div className="h-14 w-14 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-700 mb-4">
             <FolderOpen className="h-7 w-7" />
           </div>
           <p className="text-slate-500 font-medium text-sm">No files yet</p>
           <p className="text-slate-700 text-xs mt-1">Upload a file above to get started</p>
         </div>
       ) : (
         <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5' : 'space-y-2.5'}>
           {filteredFiles.map((file) => (
             // ... existing file card JSX unchanged ...
           ))}
         </div>
       )}
       ```

       For the file cards loop, keep all existing JSX — just update the `key` prop to handle both `file.id` and `file.fileId` (since fetched files use `fileId`, uploaded use `id`):
       Change: `key={file.id}` → `key={file.fileId || file.id}`
       Change: `title={file.name}` → `title={file.filename || file.name}`
       Change: `{file.name}` in `<h3>` → `{file.filename || file.name}`

    IMPORTANT: Do not remove or alter the category filter, view toggle, or header sections — only modify the file list rendering section and add the useEffect.
  </action>
  <verify>
    1. Open http://localhost:5173
    2. On initial load: spinning `Loader2` icon visible briefly, then resolves (empty state or files)
    3. After a file upload: new file card appears immediately (optimistic update)
    4. After page refresh: loading spinner appears, then files are fetched from API
  </verify>
  <done>
    - `useEffect` fetch fires once on mount
    - `loading: true` initially → spinner shown
    - `loading: false` after fetch → file list or empty state shown
    - Optimistic update still works for newly uploaded files
    - File cards render `filename` field from DynamoDB response
  </done>
</task>

## Success Criteria
- [ ] `UploadDropzone.jsx` calls `POST /files/confirm` after S3 success
- [ ] Confirm failure does NOT break the success UI
- [ ] `App.jsx` uses `useEffect` to `GET /files` once on mount
- [ ] Loading spinner visible during initial fetch
- [ ] Empty state shown correctly when no files
- [ ] File cards render `filename || name` to support both optimistic and fetched data
- [ ] `npm run build` passes with no errors
