"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  team: "Team",
  analytics: "Analytics",
  settings: "Settings",
  admin: "Admin",
  users: "Users",
  billing: "Billing",
  organizations: "Organizations",
  support: "Support",
  audit: "Audit Log",
  board: "Board View",
  "enterprise-demo": "Enterprise Demo",
  guests: "Guests",
  invites: "Invitations",
  sites: "Sites",
  editor: "Editor",
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // Generate breadcrumbs from pathname if not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: "Home", href: "/dashboard" }];
    
    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip IDs in breadcrumbs - use parent label instead
      if (segment.match(/^[a-f0-9-]{36}$/i) || segment.match(/^\d+$/)) {
        return;
      }
      
      // Check if next segment is an ID - if so, this is a parent page
      const nextSegment = segments[index + 1];
      const isParentOfId = nextSegment && (nextSegment.match(/^[a-f0-9-]{36}$/i) || nextSegment.match(/^\d+$/));
      
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      items.push({
        label: isParentOfId ? label : label,
        href: index === segments.length - 1 ? undefined : currentPath,
      });
    });
    
    return items;
  })();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center flex-wrap gap-1.5">
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
              )}
              
              {isLast ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {isFirst && (
                    <Home className="h-4 w-4 inline mr-1 -mt-0.5" />
                  )}
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {isFirst && (
                    <Home className="h-4 w-4 inline mr-1 -mt-0.5" />
                  )}
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Specialized breadcrumb for project pages
export function ProjectBreadcrumbs({ 
  projectName, 
  projectId,
  currentPage 
}: { 
  projectName: string; 
  projectId: string;
  currentPage?: string;
}) {
  const items: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Projects", href: "/dashboard" },
    { label: projectName, href: `/dashboard/projects/${projectId}` },
  ];
  
  if (currentPage) {
    items.push({ label: currentPage });
  }
  
  return <Breadcrumbs items={items} />;
}

export default Breadcrumbs;
