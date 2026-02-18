"use client";

import { useNotificationContext, type NotificationContextValue } from "./notification-provider";

export function useNotifications(): NotificationContextValue {
  return useNotificationContext();
}

// Convenience hooks for specific notification types
export function useNotify() {
  const { notify } = useNotifications();

  return {
    success: (title: string, message?: string, duration?: number) =>
      notify({ type: "success", title, message, duration }),
    
    error: (title: string, message?: string, duration?: number) =>
      notify({ type: "error", title, message, duration }),
    
    warning: (title: string, message?: string, duration?: number) =>
      notify({ type: "warning", title, message, duration }),
    
    info: (title: string, message?: string, duration?: number) =>
      notify({ type: "info", title, message, duration }),
  };
}

// Example usage:
// const { notify } = useNotifications();
// const toast = useNotify();
// 
// toast.success("Project created", "Your new project is ready");
// toast.error("Failed to save", "Please try again later");
// notify({ type: "info", title: "New feature", actions: [{ label: "Learn more", onClick: () => {} }] });
