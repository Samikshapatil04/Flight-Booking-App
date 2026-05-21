'use client';

import { useState, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Toast, ToastType } from '@/types';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />,
  };

  const colors: Record<ToastType, string> = {
    success: 'border-emerald-500/30 bg-emerald-950/80',
    error: 'border-red-500/30 bg-red-950/80',
    info: 'border-sky-500/30 bg-sky-950/80',
    warning: 'border-yellow-500/30 bg-yellow-950/80',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border',
        'backdrop-blur-lg shadow-2xl min-w-[280px] max-w-sm animate-slide-up',
        colors[toast.type]
      )}
    >
      {icons[toast.type]}
      <p className="text-sm text-white/90 flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/40 hover:text-white/80 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
