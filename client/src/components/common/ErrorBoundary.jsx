import React from 'react';
import ErrorState from './ErrorState';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <ErrorState
            title="Component Error"
            message={this.state.error?.message || 'A client-side error occurred while rendering this view.'}
            onRetry={this.handleReset}
            retryLabel="Reload Page"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
