"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  /** رسالة مخصصة (اختياري) */
  fallbackMessage?: string;
  /** عنصر بديل كامل (اختياري) */
  fallback?: React.ReactNode;
  /** تُنادى لما يحصل خطأ */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** اسم المنطقة (للتشخيص) */
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

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        dir="rtl"
        className="flex min-h-40 flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground">
            {this.props.fallbackMessage ?? "الجزء ده مش شغال حالياً"}
          </p>
          <p className="text-xs text-muted-foreground">
            باقي الصفحة شغالة عادي. تقدر تحاول تاني.
          </p>
        </div>
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
      </div>
    );
  }
}