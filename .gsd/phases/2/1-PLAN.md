---
phase: 2
plan: 1
wave: 1
---

# Plan 2.1: Design System & CSS Foundation

## Objective
Replace boilerplate CSS, add Google Fonts (Inter), and establish the glassmorphism design tokens that all components will use. This is the pure style foundation — no logic changes.

## Context
- `frontend/src/index.css` — global body styles (currently system fonts, slate-900 bg)
- `frontend/src/App.css` — stale Vite boilerplate, to be replaced
- `frontend/index.html` — needs Google Fonts link tag
- `.gsd/DECISIONS.md` — glassmorphism spec: `bg-white/10 backdrop-blur-md border border-white/20`

## Tasks

<task type="auto">
  <name>Inject Google Fonts and overhaul global CSS</name>
  <files>
    frontend/index.html
    frontend/src/index.css
    frontend/src/App.css
  </files>
  <action>
    1. In `frontend/index.html`, add inside `<head>`:
       ```html
       <link rel="preconnect" href="https://fonts.googleapis.com">
       <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
       <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
       ```
       Also update `<title>` to: `CloudVault AI — Developer File Storage`

    2. In `frontend/src/index.css`, replace the body declaration with:
       ```css
       @import "tailwindcss";

       body {
         margin: 0;
         font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
         -webkit-font-smoothing: antialiased;
         -moz-osx-font-smoothing: grayscale;
         background-color: #0a0f1e;
         color: #f1f5f9;
       }

       /* Smooth scrollbar */
       * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
       *::-webkit-scrollbar { width: 6px; }
       *::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }

       /* Glassmorphism utility — used across components */
       .glass {
         background: rgba(255, 255, 255, 0.05);
         backdrop-filter: blur(12px);
         -webkit-backdrop-filter: blur(12px);
         border: 1px solid rgba(255, 255, 255, 0.1);
       }

       /* Glow effects */
       .glow-blue { box-shadow: 0 0 20px rgba(59, 130, 246, 0.15); }
       .glow-purple { box-shadow: 0 0 20px rgba(147, 51, 234, 0.15); }

       /* Animated gradient background */
       .bg-gradient-animated {
         background: radial-gradient(ellipse at top left, rgba(59,130,246,0.08) 0%, transparent 50%),
                     radial-gradient(ellipse at bottom right, rgba(147,51,234,0.06) 0%, transparent 50%),
                     #0a0f1e;
       }
       ```

    3. In `frontend/src/App.css`, DELETE all existing content (it is stale Vite boilerplate). Replace with a single comment:
       ```css
       /* CloudVault AI — component-level styles live in index.css or inline via Tailwind */
       ```

    - DO NOT remove or break the `@import "tailwindcss"` line in index.css
  </action>
  <verify>Run `npm run dev` in frontend/ — browser loads with Inter font and dark #0a0f1e background. No console errors.</verify>
  <done>
    - `index.html` has Google Fonts link
    - `index.css` has `.glass`, `.glow-blue`, `.bg-gradient-animated` utility classes
    - `App.css` is stripped of boilerplate
    - Page background visually darker than before (#0a0f1e vs #0f172a)
  </done>
</task>

## Success Criteria
- [ ] Inter font loads from Google Fonts (visible in browser dev tools → Network → Fonts)
- [ ] `.glass` CSS class is available globally
- [ ] Background is deep navy `#0a0f1e`
- [ ] No stylesheet errors in the console
