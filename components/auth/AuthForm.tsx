"use client";

import * as React from "react";
import { Check, Eye, EyeOff, AlertTriangle, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Form wrapper                                                        */
/* ------------------------------------------------------------------ */

interface AuthFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function AuthForm({ children, className, ...props }: AuthFormProps) {
  return (
    <form className={cn("space-y-4", className)} noValidate {...props}>
      {children}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Validation state helpers                                            */
/* ------------------------------------------------------------------ */

export type ValidationState = "idle" | "valid" | "invalid";

/* ------------------------------------------------------------------ */
/* AuthInput — text/email input with inline validation                 */
/* ------------------------------------------------------------------ */

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  validationState?: ValidationState;
  successMessage?: string;
}

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  (
    { label, error, icon, className, id, validationState = "idle", successMessage, ...props },
    ref
  ) => {
    const inputId = id || props.name;
    const showSuccess = validationState === "valid" && !error;
    const showError = validationState === "invalid" || !!error;

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-11 w-full rounded-xl border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
              "focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-60",
              icon && "pr-10",
              (showSuccess || showError) && "pl-10",
              showError &&
                "border-destructive focus:border-destructive focus:ring-destructive/20",
              showSuccess &&
                "border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-500/20",
              className
            )}
            aria-invalid={showError || undefined}
            {...props}
          />
          {showSuccess && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500">
              <Check className="h-4 w-4" />
            </span>
          )}
          {showError && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-destructive">
              <X className="h-4 w-4" />
            </span>
          )}
        </div>
        {error && (
          <p className="flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {!error && showSuccess && successMessage && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";

/* ------------------------------------------------------------------ */
/* AuthPasswordInput — password input with visibility toggle + caps    */
/* ------------------------------------------------------------------ */

interface AuthPasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  validationState?: ValidationState;
  successMessage?: string;
}

export const AuthPasswordInput = React.forwardRef<
  HTMLInputElement,
  AuthPasswordInputProps
>(
  (
    { label, error, icon, className, id, validationState = "idle", successMessage, onKeyUp, ...props },
    ref
  ) => {
    const inputId = id || props.name;
    const [show, setShow] = React.useState(false);
    const [capsOn, setCapsOn] = React.useState(false);

    const showSuccess = validationState === "valid" && !error;
    const showError = validationState === "invalid" || !!error;

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (typeof e.getModifierState === "function") {
        setCapsOn(e.getModifierState("CapsLock"));
      }
      onKeyUp?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setCapsOn(false);
      props.onBlur?.(e);
    };

    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={show ? "text" : "password"}
            className={cn(
              "h-11 w-full rounded-xl border border-border bg-muted/30 px-3 pl-16 text-sm text-foreground placeholder:text-muted-foreground transition-colors",
              "focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-60",
              icon && "pr-10",
              showError &&
                "border-destructive focus:border-destructive focus:ring-destructive/20",
              showSuccess &&
                "border-emerald-500/60 focus:border-emerald-500 focus:ring-emerald-500/20",
              className
            )}
            aria-invalid={showError || undefined}
            onKeyUp={handleKeyUp}
            onBlur={handleBlur}
            {...props}
          />
          <div className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {showSuccess && (
              <span className="pointer-events-none text-emerald-500">
                <Check className="h-4 w-4" />
              </span>
            )}
            {showError && (
              <span className="pointer-events-none text-destructive">
                <X className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
        {capsOn && (
          <p className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-3 w-3" />
            تنبيه: زر Caps Lock مفعّل
          </p>
        )}
        {error && (
          <p className="flex items-center gap-1 text-xs font-medium text-destructive">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {!error && showSuccess && successMessage && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {successMessage}
          </p>
        )}
      </div>
    );
  }
);
AuthPasswordInput.displayName = "AuthPasswordInput";

/* ------------------------------------------------------------------ */
/* AuthError — server-side error banner                                */
/* ------------------------------------------------------------------ */

interface AuthErrorProps {
  message: string | null;
}

export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
      {message}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AuthDivider — "or" separator                                        */
/* ------------------------------------------------------------------ */

interface AuthDividerProps {
  label?: string;
}

export function AuthDivider({ label = "أو" }: AuthDividerProps) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-3 text-xs font-medium text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}