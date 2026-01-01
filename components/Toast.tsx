import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
}

const toastConfig = {
  duration: 5000,
  colors: {
    success: 'bg-green-600/20 border-green-500 text-green-300',
    error: 'bg-red-600/20 border-red-500 text-red-300',
    info: 'bg-sky-600/20 border-sky-500 text-sky-300',
  },
};

/**
 *
 */
export const Toast: React.FC<ToastProps> = ({ toast }): JSX.Element => {
  const { dispatch } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
    }, toastConfig.duration);

    return () => clearTimeout(timer);
  }, [toast.id, dispatch]);

  /**
   *
   */
  const handleDismiss = (): void => {
    dispatch({ type: 'REMOVE_TOAST', payload: toast.id });
  };

  const colorClasses = toastConfig.colors[toast.type];

  return (
    <div
      role="alert"
      className={`relative w-full max-w-sm p-4 pr-10 rounded-lg shadow-lg border text-sm animate-fade-in-up ${colorClasses}`}
    >
      <p>{toast.message}</p>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};
