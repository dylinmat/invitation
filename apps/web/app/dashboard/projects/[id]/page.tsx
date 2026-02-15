"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Mail,
  LayoutTemplate,
  Settings,
  BarChart3,
  ExternalLink,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { projectsApi } from "@/lib/api";
import { formatDate, formatNumber } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navTabs = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "guests", label: "Guests", icon: Users },
  { id: "invites", label: "Invites", icon: Mail },
  { id: "sites", label: "Sites", icon: LayoutTemplate },
  { id: "settings", label: "Settings", icon: Settings },
];

function StatCard({
  title,
  value,
  description,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        {trend && (
          <p
            className={`text-xs ${
              trend.positive ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend.positive ? "+" : "-"}
            {trend.value}% from last week
          </p>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only enable query after client mount and when authenticated
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
    enabled: mounted && !!projectId && isAuthenticated,
  });

  // Show loading state during SSR or before mount
  if (!mounted || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <p className="text-muted-foreground mt-2">
          The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have
          access.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  const stats = project.stats || {
    totalGuests: 0,
    totalInvites: 0,
    rsvpYes: 0,
    rsvpPending: 0,
    rsvpNo: 0,
  };

  const rsvpRate = stats.totalInvites > 0
    ? Math.round((stats.rsvpYes / stats.totalInvites) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={project.status === "active" ? "success" : "secondary"}>
                {project.status}
              </Badge>
            </div>
            {project.eventDate && (
              <p className="text-sm text-muted-foreground">
                Event date: {formatDate(project.eventDate)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/editor/${projectId}`}>
              <Edit className="mr-2 h-4 w-4" />
              Open Editor
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="#" target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          {navTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
              <tab.icon className="h-4 w-4 hidden sm:inline" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Guests"
              value={formatNumber(stats.totalGuests)}
              description="Across all invites"
            />
            <StatCard
              title="Invites Sent"
              value={formatNumber(stats.totalInvites)}
              description="Total invitations"
            />
            <StatCard
              title="RSVP Yes"
              value={formatNumber(stats.rsvpYes)}
              description={`${rsvpRate}% response rate`}
            />
            <StatCard
              title="Pending"
              value={formatNumber(stats.rsvpPending)}
              description="Awaiting response"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Guest Management
                </CardTitle>
                <CardDescription>
                  Import guests, manage plus-ones, and track dietary preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/projects/${projectId}/guests`}>
                    Manage Guests
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Send Invitations
                </CardTitle>
                <CardDescription>
                  Send personalized invitations and track delivery status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/projects/${projectId}/invites`}>
                    Manage Invites
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5" />
                  Design Sites
                </CardTitle>
                <CardDescription>
                  Create and manage invitation sites and landing pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/projects/${projectId}/sites`}>
                    Manage Sites
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guests">
          <Card>
            <CardHeader>
              <CardTitle>Guest Management</CardTitle>
              <CardDescription>
                This tab would show the full guest management interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Guest list, import, and management features would be implemented
                here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites">
          <Card>
            <CardHeader>
              <CardTitle>Invitations</CardTitle>
              <CardDescription>
                Manage and send invitations to your guests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Invitation creation, sending, and tracking would be implemented
                here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sites">
          <Card>
            <CardHeader>
              <CardTitle>Sites</CardTitle>
              <CardDescription>
                Manage your invitation websites and landing pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Site management and publishing would be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>
                Configure project details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Project settings and configuration would be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
