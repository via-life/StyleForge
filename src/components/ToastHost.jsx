import { useEffect } from 'react';

import './ToastHost.css';

export default function ToastHost({ toast, onClear }) {
  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(onClear, 2400);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast, onClear]);

  if (!toast) {
    return null;
  }

  return (
    <div className={`toast-host toast-host--${toast.tone || 'info'}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}
