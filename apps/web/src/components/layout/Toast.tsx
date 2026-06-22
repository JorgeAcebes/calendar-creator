// =============================================================================
// Toast — Non-blocking notification system
// =============================================================================
// Lightweight toast component for warnings, errors, and info messages.
// Uses a simple global state pattern (no external dependencies).
// =============================================================================

import React, { useState, useCallback, useSyncExternalStore } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Toast Types & Store
// ---------------------------------------------------------------------------

export type ToastType = 'warning' | 'info' | 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  /** Optional confirm button label */
  confirmLabel?: string;
  /** Callback when confirm is clicked */
  onConfirm?: () => void;
  /** Auto-dismiss timeout in ms (default 4000, 0 = manual only) */
  duration?: number;
}

// Simple external store for toasts
let toasts: ToastMessage[] = [];
let listeners: Set<() => void> = new Set();

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ToastMessage[] {
  return toasts;
}

export function showToast(toast: Omit<ToastMessage, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  toasts = [...toasts, { ...toast, id }];
  emitChange();

  const duration = toast.duration ?? 4000;
  if (duration > 0 && !toast.onConfirm) {
    setTimeout(() => dismissToast(id), duration);
  }
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emitChange();
}

// ---------------------------------------------------------------------------
// Toast Icon Map
// ---------------------------------------------------------------------------

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
  success: <CheckCircle2 size={16} />,
  error: <XCircle size={16} />,
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  warning: {
    bg: 'rgba(255, 159, 10, 0.12)',
    border: 'rgba(255, 159, 10, 0.35)',
    icon: '#ff9f0a',
  },
  info: {
    bg: 'rgba(10, 132, 255, 0.12)',
    border: 'rgba(10, 132, 255, 0.35)',
    icon: '#0a84ff',
  },
  success: {
    bg: 'rgba(48, 209, 88, 0.12)',
    border: 'rgba(48, 209, 88, 0.35)',
    icon: '#30d158',
  },
  error: {
    bg: 'rgba(255, 69, 58, 0.12)',
    border: 'rgba(255, 69, 58, 0.35)',
    icon: '#ff453a',
  },
};

// ---------------------------------------------------------------------------
// Toast Item Component
// ---------------------------------------------------------------------------

const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const [exiting, setExiting] = useState(false);
  const colors = TOAST_COLORS[toast.type];

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => dismissToast(toast.id), 200);
  }, [toast.id]);

  const handleConfirm = useCallback(() => {
    toast.onConfirm?.();
    setExiting(true);
    setTimeout(() => dismissToast(toast.id), 200);
  }, [toast]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '10px 14px',
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        maxWidth: 380,
        animation: exiting ? 'toastOut 0.2s ease-in forwards' : 'toastIn 0.25s ease-out both',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ color: colors.icon, flexShrink: 0, marginTop: 2 }}>
        {TOAST_ICONS[toast.type]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 500,
            color: '#ffffff',
            lineHeight: 1.45,
            wordBreak: 'break-word',
          }}
        >
          {toast.message}
        </p>
        {toast.confirmLabel && toast.onConfirm && (
          <button
            onClick={handleConfirm}
            style={{
              marginTop: 8,
              padding: '4px 14px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-ui)',
              color: '#fff',
              background: colors.icon,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            {toast.confirmLabel}
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        style={{
          flexShrink: 0,
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          borderRadius: 4,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Toast Container (mount once in App)
// ---------------------------------------------------------------------------

const ToastContainer: React.FC = () => {
  const currentToasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (currentToasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {currentToasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
};

export default ToastContainer;
