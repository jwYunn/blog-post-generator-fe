import { X, CheckCircle2, XCircle } from 'lucide-react';
import type { ToastItem } from '../hooks/useToast';

interface Props {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-xl shadow-lg text-sm font-medium min-w-[260px] max-w-[420px] pointer-events-auto animate-in ${
            toast.type === 'success'
              ? 'bg-gray-900 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-400" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0 text-red-200" />
          )}
          <span className="flex-1 leading-snug">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                onRemove(toast.id);
              }}
              className={`flex-shrink-0 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
                toast.type === 'success'
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => onRemove(toast.id)}
            className="ml-1 p-0.5 opacity-50 hover:opacity-100 transition-opacity rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
