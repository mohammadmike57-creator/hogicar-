import React, { Component, ErrorInfo, ReactNode } from 'react';
import { isChunkLoadError, reloadForNewVersion } from '../utils/chunkReload';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  reloading: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, reloading: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // A new version was deployed while the page was open: reload to get it.
    if (isChunkLoadError(error) && reloadForNewVersion()) {
      this.setState({ reloading: true });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isUpdate = isChunkLoadError(this.state.error);
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          {this.state.reloading ? (
            <>
              <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
              <h1 className="mt-5 text-lg font-bold text-slate-900">Loading the latest version…</h1>
              <p className="mt-2 text-sm text-slate-500">Hogicar was just updated. This takes a second.</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900">{isUpdate ? 'Hogicar has been updated' : 'Something went wrong'}</h1>
              <p className="mt-2 text-sm text-slate-500">
                {isUpdate
                  ? 'Please refresh the page to load the latest version.'
                  : 'Sorry, this page could not be displayed. Please refresh the page or go back to the home page.'}
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button type="button" onClick={this.handleReload} className="h-11 rounded-lg bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-700">
                  Refresh page
                </button>
                <a href="/" className="flex h-11 items-center justify-center rounded-lg border border-slate-300 px-6 text-sm font-semibold text-slate-700 hover:border-accent hover:text-accent">
                  Go to home page
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
