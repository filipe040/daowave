"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "error" | "warning";
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-medium shadow-lg animate-slide-up",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        variant === "error" && "border-red-200 bg-red-50 text-red-800",
        variant === "warning" && "border-amber-200 bg-amber-50 text-amber-800",
        variant === "default" && "border-neutral-200 bg-white text-neutral-900 shadow-md",
        className
      )}
      {...props}
    />
  )
);
Toast.displayName = "Toast";

export { Toast };
