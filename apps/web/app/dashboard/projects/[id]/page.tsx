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
  Sparkles,
  Bell,
  Clock,
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
import { ProjectBreadcrumbs } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
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

// Coming Soon Tab Content
function ComingSoonTab({
  feature,
  description,
  icon: Icon,
}: {
  feature: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <EmptyState
          variant="custom"
          icon={() => (
            <div className="h-20 w-20 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Icon className="h-10 w-10 text-amber-400" />
            </div>
          )}
          title={`${feature} coming soon`}
          description={description}
          primaryAction={{
            label: "Get notified",
            onClick: () => {},
            icon: Bell,
          }}
          secondaryAction={{
            label: "Learn more",
            onClick: () => {},
          }}
        />
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
        <Link href="/dashboard" className="mt-6">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
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

  // Generate preview URL
  const previewUrl = project.sites?.[0]?.subdomain 
    ? `https://${project.sites[0].subdomain}.eios.app`
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <ProjectBreadcrumbs 
        projectName={project.name} 
        projectId={project.id}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" aria-label="Back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant={project.status === "active" ? "default" : "secondary"}>
                {project.status}
              </Badge>
            </div>
            {project.eventDate && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Event date: {formatDate(project.eventDate)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/editor/${projectId}`}>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Open Editor
            </Button>
          </Link>
          {previewUrl ? (
            <Link href={previewUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Preview
              </Button>
            </Link>
          ) : (
            <Button variant="outline" className="gap-2" disabled>
              <ExternalLink className="h-4 w-4" />
              Preview
            </Button>
          )}
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
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("guests")}
                >
                  Manage Guests
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
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("invites")}
                >
                  Manage Invites
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
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setActiveTab("sites")}
                >
                  Manage Sites
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guests">
          <ComingSoonTab
            feature="Guest Management"
            description="Import contacts, manage plus-ones, track dietary restrictions, and organize your guest list. This feature is currently in development and will be available soon."
            icon={Users}
          />
        </TabsContent>

        <TabsContent value="invites">
          <ComingSoonTab
            feature="Invitation Management"
            description="Create beautiful invitations, send them via email or SMS, and track opens and RSVPs in real-time. This feature is currently in development and will be available soon."
            icon={Mail}
          />
        </TabsContent>

        <TabsContent value="sites">
          <ComingSoonTab
            feature="Site Builder"
            description="Design stunning invitation websites with our drag-and-drop editor. Choose from templates or start from scratch. This feature is currently in development and will be available soon."
            icon={LayoutTemplate}
          />
        </TabsContent>

        <TabsContent value="settings">
          <ComingSoonTab
            feature="Project Settings"
            description="Configure event details, customize branding, set up integrations, and manage project preferences. This feature is currently in development and will be available soon."
            icon={Settings}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
