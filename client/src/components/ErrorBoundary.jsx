import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You can also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">⚠️</div>
              <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
              <p className="text-gray-600">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>
            
            {this.props.showDetails && (
              <details className="mb-4 border rounded p-3 bg-gray-50">
                <summary className="cursor-pointer font-medium text-sm text-gray-700">
                  Error Details
                </summary>
                <div className="mt-2 text-xs overflow-auto max-h-40">
                  <p className="font-semibold">Error:</p>
                  <pre className="whitespace-pre-wrap break-words">
                    {this.state.error?.toString()}
                  </pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <p className="font-semibold mt-2">Component Stack:</p>
                      <pre className="whitespace-pre-wrap break-words text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Try Again
              </button>
              <button
                onClick={this.handleRefresh}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
              >
                Refresh Page
              </button>
            </div>
            
            {this.props.contactSupport && (
              <p className="text-center text-xs text-gray-500 mt-4">
                If the problem persists, please contact support.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default props
ErrorBoundary.defaultProps = {
  showDetails: process.env.NODE_ENV === 'development',
  contactSupport: true
};

export default ErrorBoundary;