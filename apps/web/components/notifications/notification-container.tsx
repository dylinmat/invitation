"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { NotificationToast } from "./notification-toast";
import type { Notification } from "./notification-provider";

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

export function NotificationContainer({
  notifications,
  onDismiss,
}: NotificationContainerProps) {
  return (
    <>
      {/* Desktop: Top-right */}
      <div className="fixed top-4 right-4 z-[100] hidden md:block pointer-events-none">
        <div className="flex flex-col items-end space-y-3 pointer-events-auto">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, index) => (
              <NotificationToast
                key={notification.id}
                notification={notification}
                onDismiss={onDismiss}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile: Bottom-center */}
      <div className="fixed bottom-4 left-4 right-4 z-[100] md:hidden pointer-events-none">
        <div className="flex flex-col items-center space-y-3 pointer-events-auto">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification, index) => (
              <NotificationToast
                key={notification.id}
                notification={notification}
                onDismiss={onDismiss}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
