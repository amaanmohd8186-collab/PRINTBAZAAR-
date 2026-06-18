// @ts-nocheck
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 text-center border-2 border-dashed border-red-500/20 bg-red-500/5 rounded-2xl flex flex-col items-center justify-center space-y-3 mx-auto">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="text-zinc-400 font-medium">Something went wrong. This section is temporarily unavailable.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
