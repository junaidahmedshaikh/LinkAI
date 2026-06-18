import { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "@/utils/logger";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error("ui", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-sm text-red-300">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 text-xs text-muted-foreground">{this.state.message}</p>
          <button
            type="button"
            className="mt-3 rounded-lg bg-accent px-3 py-1.5 text-xs text-white"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
