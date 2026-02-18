"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  HelpCircle,
} from "lucide-react";

const mobileNavItems = [
  {
    title: "Projects",
    href: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Help",
    href: "/dashboard/help",
    icon: HelpCircle,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
      <div className="flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 min-h-[56px] min-w-[64px] transition-colors active:scale-95 touch-manipulation",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 mb-1",
                  isActive && "text-primary"
                )} 
              />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for notched devices */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
}
