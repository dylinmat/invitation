"use client";

import Link from "next/link";
import { useState } from "react";
import { Calendar, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { GlobalSearch } from "@/components/global-search";
import { DashboardNav } from "./nav";
import { useNotifications } from "@/components/notifications";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const { notify } = useNotifications();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col h-full">
              {/* Mobile Logo */}
              <div className="flex items-center h-16 px-4 border-b">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-xl font-serif">
                    EIOS
                  </span>
                </Link>
              </div>
              {/* Mobile Navigation */}
              <div className="flex-1 py-4">
                <DashboardNav />
              </div>
            </div>
          </SheetContent>
        </Sheet>

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
        <div className="ml-auto flex items-center space-x-2 sm:space-x-3">
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
            aria-label="Notifications"
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

export default DashboardHeader;
