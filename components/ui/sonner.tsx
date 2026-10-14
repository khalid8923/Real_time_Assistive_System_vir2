"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      position="top-center"
      dir="rtl"
      richColors
      closeButton
      duration={5000}
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:font-sans",
          title: "group-[.toast]:font-bold group-[.toast]:text-sm",
          description: "group-[.toast]:text-xs group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:text-xs group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:text-xs",
          error: "group-[.toaster]:bg-destructive/10 group-[.toaster]:border-destructive/30 group-[.toaster]:text-destructive",
          success: "group-[.toaster]:bg-emerald-500/10 group-[.toaster]:border-emerald-500/30",
          warning: "group-[.toaster]:bg-amber-500/10 group-[.toaster]:border-amber-500/30",
        },
      }}
      {...props}
    />
  );
}