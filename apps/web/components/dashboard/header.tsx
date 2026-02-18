"use client";

import Link from "next/link";
import { Calendar, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { GlobalSearch } from "@/components/global-search";
import { useNotifications } from "@/components/notifications";

export function DashboardHeader() {
  const { notify } = useNotifications();

  const handleShowNotification = () => {
    notify({
      type: "info",
      title: "Notifications",
      message: "You have 3 new notifications",
      actions: [
        {
          label: "View all",
          onClick: () => console.log("View all notifications"),
        },
      ],
    });
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 mr-8">
          <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center shadow-sm">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl hidden md:inline font-serif">
            EIOS
          </span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <GlobalSearch />
        </div>

        {/* Right Side */}
        <div className="ml-auto flex items-center space-x-3">
          {/* Mobile Search Button */}
          <div className="sm:hidden">
            <GlobalSearch />
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={handleShowNotification}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </Button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
