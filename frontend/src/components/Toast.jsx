import { useToast } from '../context/ToastContext';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';

const ICONS = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
  error:   <XCircle     className="h-4 w-4 text-rose-400 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
  info:    <Info        className="h-4 w-4 text-blue-400 shrink-0" />,
};

const BORDERS = {
  success: 'border-emerald-500/20',
  error:   'border-rose-500/20',
  warning: 'border-amber-500/20',
  info:    'border-blue-500/20',
};

const Toast = () => {
  const { toasts } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`animate-slide-up pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl shadow-black/30 bg-slate-900/95 backdrop-blur-sm ${BORDERS[toast.type] || BORDERS.info}`}
        >
          {ICONS[toast.type] || ICONS.info}
          <p className="text-sm font-medium text-slate-200 leading-snug">{toast.message}</p>
        </div>
      ))}
    </div>
  );
};

export default Toast;
