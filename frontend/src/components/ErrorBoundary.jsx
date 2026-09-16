import React from 'react';
import { AlertCircle, RotateCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-xl mx-auto my-12 rounded-lg bg-white border border-red-200 text-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <h2 className="text-base font-semibold">Something went wrong</h2>
          </div>
          <p className="text-xs text-slate-500">
            An unexpected error occurred while rendering this view:
          </p>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 font-mono text-xs text-red-700 overflow-x-auto">
            {this.state.error?.toString()}
          </div>
          {this.state.errorInfo?.componentStack && (
            <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-mono max-h-40 overflow-y-auto">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg inline-flex items-center gap-2 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
