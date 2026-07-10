import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 animate-pulse" />
            </div>
            
            <h1 className="font-display text-2xl font-semibold text-gray-900 mb-3">Atelier Encountered an Issue</h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              We encountered an unexpected error while loading your design canvas. Your progress is safe, but we need to reset the workspace.
            </p>

            {this.state.error && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left font-mono text-[10px] text-gray-600 mb-6 overflow-x-auto max-h-32">
                <span className="font-bold text-red-700">Error:</span> {this.state.error.message}
                {this.state.error.stack && (
                  <pre className="mt-2 text-gray-400 whitespace-pre-wrap">{this.state.error.stack.split('\n').slice(0, 3).join('\n')}</pre>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset Workspace
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" /> Reload Page
              </button>
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 mt-6">Couture AI Atelier Diagnostics</p>
        </div>
      );
    }

    return this.props.children;
  }
}
