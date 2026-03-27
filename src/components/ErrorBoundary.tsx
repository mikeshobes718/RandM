'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="max-w-md w-full surface-card p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-error-container flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-on-error-container" style={{ fontSize: 28 }}>warning</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">Something went wrong</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-6 p-4 bg-error-container/30 rounded-xl">
                <summary className="cursor-pointer font-semibold text-on-error-container text-sm">
                  Error Details (Dev Only)
                </summary>
                <pre className="mt-3 text-xs text-on-error-container/80 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="primary-button h-11 px-6 text-sm font-semibold gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                Refresh Page
              </button>
              <a
                href="/"
                className="secondary-button h-11 px-6 text-sm font-semibold"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function SectionErrorBoundary({ children, section }: { children: ReactNode; section: string }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="surface-card p-6 text-center bg-error-container/20">
          <p className="text-on-error-container font-semibold mb-2">Unable to load {section}</p>
          <p className="text-sm text-on-error-container/70">Please refresh the page or contact support if this persists.</p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
