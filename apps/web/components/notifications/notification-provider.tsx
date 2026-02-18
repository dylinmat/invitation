"use client";

import React, { createContext, useContext, useCallback, useState, useRef } from "react";
import { NotificationContainer } from "./notification-container";

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationContextValue {
  notify: (notification: Omit<Notification, "id">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
  defaultDuration?: number;
}

export function NotificationProvider({
  children,
  maxNotifications = 5,
  defaultDuration = 5000,
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const idCounter = useRef(0);

  const notify = useCallback(
    (notification: Omit<Notification, "id">): string => {
      const id = `notification-${Date.now()}-${idCounter.current++}`;
      const newNotification: Notification = {
        ...notification,
        id,
        duration: notification.duration ?? defaultDuration,
      };

      setNotifications((prev) => {
        // Add new notification at the beginning, limit to max
        const updated = [newNotification, ...prev];
        return updated.slice(0, maxNotifications);
      });

      return id;
    },
    [maxNotifications, defaultDuration]
  );

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextValue = {
    notify,
    dismiss,
    dismissAll,
    notifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismiss}
        onDismissAll={dismissAll}
      />
    </NotificationContext.Provider>
  );
}
