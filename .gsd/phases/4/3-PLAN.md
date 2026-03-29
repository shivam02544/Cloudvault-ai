---
phase: 4
plan: 3
wave: 2
---

# Plan 4.3: Frontend — Toast Context & Component

## Objective
Construct a lightweight, dependency-free React Toast capability mimicking the app's glassmorphism style rules.

## Context
- `.gsd/DECISIONS.md` Phase 4: Build custom lightweight toast using Tailwind (glassmorphism style).
- `frontend/src/context/ToastContext.jsx` (to be created)
- `frontend/src/components/Toast.jsx` (to be created)
- `frontend/src/index.css` (existing)

## Tasks

<task type="auto">
  <name>Define UI Animation Base for Toasts</name>
  <files>frontend/src/index.css</files>
  <action>
    Append Tailwind safe animation definitions into the application styles. Add these helper classes manually:
    ```css
    @keyframes slide-up {
      0% { opacity: 0; transform: translateY(100%) scale(0.9); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    ```
  </action>
  <verify>Check `frontend/src/index.css` for `animate-slide-up` declaration.</verify>
  <done>Core UI animations natively supported.</done>
</task>

<task type="auto">
  <name>Create minimal ToastContext and Provider</name>
  <files>frontend/src/context/ToastContext.jsx</files>
  <action>
    Implement a simple React context `ToastContext` providing a `addToast(message, type)` function. 
    State manages an array of toasts array. Yield a `useToast` custom hook.
  </action>
  <verify>File `frontend/src/context/ToastContext.jsx` exports `ToastProvider` and `useToast`.</verify>
  <done>Provider reliably handles pushing/diminisihing state elements gracefully with timer resets.</done>
</task>

<task type="auto">
  <name>Build styling Toast layer presentation component</name>
  <files>frontend/src/components/Toast.jsx</files>
  <action>
    Create a component that renders the toasts array visually overlaying the DOM (fixed bottom-right or top-right).
    - Map over active toasts inside the fixed container.
    - Each toast uses `.glass` class. Decorate via type (e.g. success = green check, error = red X, info = blue info).
    - Ensure `.animate-slide-up` drops in. Wait ~4000ms until automatically purging element from the array upstream in context.
  </action>
  <verify>File `frontend/src/components/Toast.jsx` reflects proper Glassmorphism presentation styling mapping generic types to UI colorways.</verify>
  <done>Presentation layer seamlessly aligns with spec constraints.</done>
</task>

## Success Criteria
- [ ] `ToastContext` exports cleanly and manages an isolated active-timeout memory state.
- [ ] `Toast.jsx` presents elements leveraging the existing `glass` and icon utilities beautifully.
- [ ] `index.css` provides native smooth-transition support.
