"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeader } from "@/components/layout/section";
import { StatsCard, StatsGrid } from "@/components/admin/stats-card";
import { SystemHealthBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { useAdminDashboard } from "@/hooks/useAdmin";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Users2,
  Plus,
  Settings,
  Mail,
} from "lucide-react";

// Types
interface ActivityItem {
  id: string;
  type: "user" | "org" | "billing" | "system" | "support";
  description: string;
  timestamp: string;
  actor?: { name: string; email?: string };
}

const quickActions = [
  { label: "Add User", icon: Users, href: "/admin/users" },
  { label: "Create Org", icon: Building2, href: "/admin/organizations" },
  { label: "System Settings", icon: Settings, href: "/admin/settings" },
  { label: "Send Announcement", icon: Mail, href: "/admin/support" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function getActivityIcon(type: ActivityItem["type"]) {
  switch (type) {
    case "user":
      return Users2;
    case "org":
      return Building2;
    case "billing":
      return DollarSign;
    case "support":
      return Activity;
    case "system":
      return Server;
    default:
      return Activity;
  }
}

function getActivityColor(type: ActivityItem["type"]) {
  switch (type) {
    case "user":
      return "bg-blue-100 text-blue-700";
    case "org":
      return "bg-purple-100 text-purple-700";
    case "billing":
      return "bg-green-100 text-green-700";
    case "support":
      return "bg-orange-100 text-orange-700";
    case "system":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const { stats, health, activities, isLoading, isError, error, refetch } = useAdminDashboard();

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Dashboard refreshed",
      description: "Latest data has been loaded.",
    });
  };

  if (isError) {
    toast({
      title: "Error loading dashboard",
      description: error?.message || "Failed to load dashboard data. Please try again.",
      variant: "destructive",
    });
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Admin Dashboard"
          description="Platform overview and system management"
          actions={
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          }
        />
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants}>
        <Section>
          <StatsGrid columns={4}>
            <StatsCard
              title="Total Users"
              value={isLoading ? "..." : stats?.totalUsers.toLocaleString() || "0"}
              description={isLoading ? undefined : `${stats?.newUsersToday || 0} new today`}
              icon={Users}
              trend={
                isLoading || !stats
                  ? undefined
                  : { value: stats.userGrowth, direction: "up", label: "vs last month" }
              }
              loading={isLoading}
              variant="default"
            />
            <StatsCard
              title="Organizations"
              value={isLoading ? "..." : stats?.totalOrganizations.toLocaleString() || "0"}
              icon={Building2}
              loading={isLoading}
              variant="info"
            />
            <StatsCard
              title="Total Events"
              value={isLoading ? "..." : stats?.totalEvents.toLocaleString() || "0"}
              description="Across all organizations"
              icon={Calendar}
              loading={isLoading}
              variant="success"
            />
            <StatsCard
              title="Active Projects"
              value={isLoading ? "..." : stats?.activeProjects.toLocaleString() || "0"}
              icon={DollarSign}
              trend={
                isLoading || !stats
                  ? undefined
                  : { value: stats.revenueGrowth, direction: "up", label: "vs last month" }
              }
              loading={isLoading}
              variant="default"
            />
          </StatsGrid>
        </Section>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Server className="h-4 w-4" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))
              ) : health ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">API</span>
                    <SystemHealthBadge health={health.api.status} uptime={health.api.uptime} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <SystemHealthBadge health={health.database.status} uptime={health.database.uptime} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Storage</span>
                    <SystemHealthBadge health={health.storage.status} uptime={health.storage.uptime} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Email Service</span>
                    <SystemHealthBadge health={health.email.status} uptime={health.email.uptime} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Realtime</span>
                    <SystemHealthBadge health={health.realtime.status} uptime={health.realtime.uptime} />
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Health data unavailable
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 justify-center"
                      asChild
                    >
                      <a href={action.href}>
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{action.label}</span>
                      </a>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {health?.realtime?.status === 'degraded' ? (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Realtime service degraded</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Elevated latency detected in realtime connections
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">All systems operational</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Platform running smoothly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants}>
        <Section>
          <SectionHeader
            title="Recent Activity"
            description="Latest platform activities"
            actions={
              <Button variant="ghost" size="sm" asChild>
                <a href="/admin/audit">View all</a>
              </Button>
            }
          />
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities && activities.length > 0 ? (
                <div className="divide-y">
                  {activities.map((activity: ActivityItem) => {
                    const Icon = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn("p-2 rounded-full", colorClass)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {activity.actor && (
                              <span className="text-xs text-muted-foreground">
                                by {activity.actor.name}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {activity.type}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      </motion.div>
    </motion.div>
  );
}
