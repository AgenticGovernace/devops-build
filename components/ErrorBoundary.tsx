/**
 * @fileoverview Error Boundary component for catching and handling React errors.
 *
 * Catches JavaScript errors anywhere in the child component tree, logs them,
 * and displays a fallback UI instead of crashing the entire application.
 *
 * @module components/ErrorBoundary
 * @category Components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props for the ErrorBoundary component.
 * @interface ErrorBoundaryProps
 */
interface ErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;
  /** Optional custom fallback UI to display on error */
  fallback?: ReactNode;
}

/**
 * State for the ErrorBoundary component.
 * @interface ErrorBoundaryState
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught, if any */
  error: Error | null;
  /** Error info containing component stack trace */
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 *
 * React Error Boundaries catch errors during rendering, in lifecycle methods,
 * and in constructors of the whole tree below them. They do NOT catch errors in:
 * - Event handlers (use try/catch)
 * - Asynchronous code (setTimeout, requestAnimationFrame, etc.)
 * - Server-side rendering
 * - Errors thrown in the error boundary itself
 *
 * @component
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Static lifecycle method called when an error is thrown.
   * Updates state to trigger fallback UI rendering.
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called after an error is caught.
   * Used for logging error information.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // TODO: Send to error reporting service in production
    // e.g., Sentry, LogRocket, etc.
  }

  /**
   * Resets the error state to allow retry.
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Reloads the page to recover from error.
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-brand-primary flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-brand-danger"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h1 className="text-xl font-bold text-brand-text-primary">
                Something went wrong
              </h1>
            </div>

            <p className="text-brand-text-secondary mb-4">
              An unexpected error occurred. This has been logged and we'll look into it.
            </p>

            {error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-brand-text-secondary hover:text-brand-accent">
                  View error details
                </summary>
                <div className="mt-2 p-3 bg-brand-primary rounded-md overflow-auto max-h-48">
                  <p className="text-sm font-mono text-brand-danger mb-2">
                    {error.toString()}
                  </p>
                  {errorInfo && (
                    <pre className="text-xs font-mono text-brand-text-secondary whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-brand-border text-brand-text-secondary font-semibold rounded-md hover:bg-brand-accent hover:text-white transition duration-200"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-2 bg-brand-accent text-white font-semibold rounded-md hover:bg-brand-accent-hover transition duration-200"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
