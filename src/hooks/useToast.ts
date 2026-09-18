import { useState, useCallback } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
  action?: ToastAction;
}

const TOAST_DURATION_MS = 3500;
// Long enough to read the message and still reach the button
const TOAST_WITH_ACTION_DURATION_MS = 8000;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (message: string, type: ToastItem['type'] = 'success', action?: ToastAction) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type, action }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, action ? TOAST_WITH_ACTION_DURATION_MS : TOAST_DURATION_MS);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
