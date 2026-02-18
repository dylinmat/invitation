"use client";

import { useState, useCallback } from "react";

export type ToastVariant = "default" | "destructive" | "success";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
  visible: boolean;
}

// Simple toast state manager (could be replaced with a context for global state)
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

const notifyListeners = () => {
  toastListeners.forEach((listener) => listener([...toasts]));
};

const addToast = (options: ToastOptions) => {
  const id = Math.random().toString(36).substring(2, 9);
  const toast: Toast = {
    ...options,
    id,
    visible: true,
    duration: options.duration || 5000,
  };
  toasts = [...toasts, toast];
  notifyListeners();

  // Auto dismiss
  setTimeout(() => {
    dismissToast(id);
  }, toast.duration);

  return id;
};

const dismissToast = (id: string) => {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
};

// Hook for using toast
export function useToast() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([]);

  // Subscribe to global toast state
  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    toastListeners.push(listener);
    listener([...toasts]);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  // Toast function
  const toast = useCallback((options: ToastOptions) => {
    addToast(options);
  }, []);

  // Dismiss function
  const dismiss = useCallback((id: string) => {
    dismissToast(id);
  }, []);

  return {
    toast,
    dismiss,
    toasts: localToasts,
    subscribe,
  };
}

// Standalone toast function for use outside of components
export const toast = (options: ToastOptions) => {
  addToast(options);
};

export default useToast;
