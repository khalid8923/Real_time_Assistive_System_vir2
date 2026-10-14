"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[error-boundary]${this.props.sectionName ? ` (${this.props.sectionName})` : ""}`,
      error,
      info.componentStack
    );
    this.props.onError?.(error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        dir="rtl"
        role="alert"
        className="flex min-h-60 flex-col items-center justify-center gap-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-8 text-center"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
          <AlertTriangle className="h-7 w-7 text-amber-500" />
        </div>

        <div className="max-w-md space-y-2">
          <p className="text-base font-bold text-amber-600 dark:text-amber-400">
            {this.props.fallbackMessage ?? "الجزء ده وقع"}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            حصلت مشكلة في الجزء ده من الصفحة. باقي الصفحة شغالة عادي.
          </p>
          <p className="pt-1 text-xs font-medium text-muted-foreground/80">
            💡 جرّب تحاول تاني — ولو استمرت المشكلة اعمل تحديث للصفحة
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={this.handleReset}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            حاول تاني
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={this.handleReload}
            className="gap-1.5"
          >
            <Home className="h-3.5 w-3.5" />
            تحديث الصفحة
          </Button>
        </div>
      </div>
    );
  }
}