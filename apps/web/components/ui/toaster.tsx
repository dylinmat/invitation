"use client";

import { useEffect, useState } from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  visible: boolean;
}

// Simple pub-sub for toasts
const toastListeners: ((toasts: ToastItem[]) => void)[] = [];
let globalToasts: ToastItem[] = [];

export const showToast = (toast: Omit<ToastItem, "id" | "visible">) => {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastItem = { ...toast, id, visible: true };
  globalToasts = [...globalToasts, newToast];
  toastListeners.forEach((listener) => listener(globalToasts));

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    dismissToast(id);
  }, 5000);
};

export const dismissToast = (id: string) => {
  globalToasts = globalToasts.filter((t) => t.id !== id);
  toastListeners.forEach((listener) => listener(globalToasts));
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (newToasts: ToastItem[]) => {
      setToasts(newToasts);
    };
    toastListeners.push(listener);
    setToasts(globalToasts);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return (
    <ToastProvider>
      {toasts.map((toast) => (
        <Toast key={toast.id} variant={toast.variant}>
          <div className="grid gap-1">
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </div>
          <ToastClose onClick={() => dismissToast(toast.id)} />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
