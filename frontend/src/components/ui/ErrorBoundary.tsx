"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#080C17' }}>
          <div className="max-w-md w-full text-center space-y-6">
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl"
              style={{ background: 'rgba(255, 82, 82, 0.1)' }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff5252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>
              An unexpected error occurred. Please try again or return to the home page.
            </p>

            {this.state.error && (
              <div
                className="p-4 rounded-xl text-left text-xs font-mono overflow-auto max-h-32"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#ff5252' }}
              >
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 rounded-full text-sm font-semibold cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFE135)',
                  color: '#080C17',
                  border: 'none',
                }}
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-6 py-3 rounded-full text-sm font-semibold no-underline inline-flex items-center"
                style={{
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
