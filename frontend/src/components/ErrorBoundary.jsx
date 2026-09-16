import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
        <div className="p-8 max-w-2xl mx-auto my-12 rounded-2xl bg-slate-900 border border-rose-500/30 text-slate-200 space-y-4 shadow-2xl">
          <div className="flex items-center gap-3 text-rose-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h2 className="text-lg font-bold">Module Render Error</h2>
          </div>
          <p className="text-xs text-slate-400">
            An unexpected error occurred while rendering this module. Details below:
          </p>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-rose-300 overflow-x-auto">
            {this.state.error?.toString()}
          </div>
          {this.state.errorInfo?.componentStack && (
            <pre className="p-3 rounded-lg bg-slate-950/80 text-[10px] text-slate-500 font-mono max-h-40 overflow-y-auto">
              {this.state.errorInfo.componentStack}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset & Return to Dashboard</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
