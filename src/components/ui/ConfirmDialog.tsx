'use client';

import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative glass-strong rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
            ${variant === 'danger' ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-red-400' : 'text-yellow-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-sky-200/70 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 btn-secondary py-2.5 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
              ${variant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-yellow-600 hover:bg-yellow-500 text-white'
              }`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
