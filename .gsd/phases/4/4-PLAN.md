---
phase: 4
plan: 4
wave: 2
---

# Plan 4.4: Frontend — Wire Actions & UI Hover States

## Objective
Introduce hover overlay options to individual file cards supporting natively invoked "Preview", "Copy", and "Delete" actions mapped to our new Toasts array and asynchronous HTTP calls.

## Context
- `frontend/src/App.jsx` (existing master grid)
- `frontend/src/context/ToastContext.jsx` (created in 4.3)
- `.gsd/DECISIONS.md` Phase 4: Hover overlay actions (copy URL, delete), error handling, glassmorphism toast.

## Tasks

<task type="auto">
  <name>Wrap application in Toast provider</name>
  <files>frontend/src/App.jsx</files>
  <action>
    - Import `ToastProvider` from `./context/ToastContext`.
    - Modify the `App` component's return value to nest inside `<ToastProvider>`. Include `<Toast />` immediately inside the provider but outside the main scroll loop (such that it renders fixed screen position).
  </action>
  <verify>App visually renders and React Tree shows correctly placed `ToastProvider` wrapper.</verify>
  <done>Parent context deployed flawlessly to subcomponents.</done>
</task>

<task type="auto">
  <name>Wire discrete API interaction logic inside App.jsx</name>
  <files>frontend/src/App.jsx</files>
  <action>
    - Ensure `useToast` applies gracefully initializing `addToast` locally.
    - Create `handleCopyUrl(fileId)` yielding an `axios.get('/files/{fileId}/url')` request. Resolve the returned `{ url }` and execute `navigator.clipboard.writeText(url)`. Throw `addToast('Copied to clipboard!', 'success')` or fallback red toast error.
    - Create `handlePreview(fileId)` firing equivalent GET request but resolving via `window.open(url, '_blank')`.
    - Create `handleDelete(fileId)` triggering `axios.delete('/files/{fileId}')`. Set local `files` state manually post-resolution (optimistic UI update dropping the file), alongside `addToast('File deleted', 'success')`.
  </action>
  <verify>File `frontend/src/App.jsx` establishes functions `handleCopyUrl`, `handlePreview`, and `handleDelete` correctly attached to asynchronous execution blocks mapped with try-catch toast errors.</verify>
  <done>Asynchronous states functionally configured.</done>
</task>

<task type="auto">
  <name>Embed absolute hover elements within File Card renderer</name>
  <files>frontend/src/App.jsx</files>
  <action>
    - Modify the file card `<div>` mapper (which natively carries `group relative`).
    - Append an overlay container block: `absolute inset-0 bg-slate-900/60 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200`. (Ensure grid/list mode styling rules respect dimensions, or restrict hover overlay natively to 'grid' view only for visual simplicity, replacing standard List view icons dynamically).
    - Insert 3 buttons: `<button onClick={() => handlePreview(file.fileId)}><Eye size={18} /></button>`, `<button onClick={() => handleCopyUrl(file.fileId)}><Copy size={18} /></button>`, `<button onClick={() => handleDelete(file.fileId)}><Trash2 size={18} /></button>`.
    - Restrict buttons utilizing generic rounded styling (e.g. `p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors`).
  </action>
  <verify>File grid visual rendering exhibits `Eye`, `Copy`, `Trash2` overlays securely on mouse enter.</verify>
  <done>UI correctly displays dynamic interaction zones.</done>
</task>

## Success Criteria
- [ ] Front-end wraps cleanly under `ToastProvider`.
- [ ] Hover overlay states are restricted to the `group` element visually smoothly via opacity transition.
- [ ] Interactive buttons trigger the explicit Lambda backends smoothly (Preview, Copy, Delete).
- [ ] Application responds with real-time feedback Toasts immediately subsequent to interaction.
