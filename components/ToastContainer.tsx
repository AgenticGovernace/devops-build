import React from 'react';
import { useAppStore } from '../store';
import { Toast } from './Toast';

/**
 *
 */
export const ToastContainer: React.FC = () => {
  const { state } = useAppStore();
  const { toasts } = state;

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex flex-col items-end px-4 py-6 pointer-events-none sm:p-6 z-50 gap-4"
    >
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
