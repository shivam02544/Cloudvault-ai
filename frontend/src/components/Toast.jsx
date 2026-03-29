import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

const Toast = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-slide-up glass px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg border-slate-700/60"
          role="alert"
        >
          {/* Icon based on type */}
          {toast.type === 'success' && (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          )}
          {toast.type === 'error' && (
            <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
          )}
          {toast.type === 'info' && (
            <Info className="h-5 w-5 text-blue-400 shrink-0" />
          )}

          <p className="text-sm font-medium text-slate-200">{toast.message}</p>
        </div>
      ))}
    </div>
  );
};

export default Toast;
