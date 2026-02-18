"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeader } from "@/components/layout/section";
import { StatsCard, StatsGrid } from "@/components/admin/stats-card";
import { StatusBadge, SystemHealthBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Timeline } from "@/components/ui/timeline";
import { useToast } from "@/hooks/useToast";
import {
  Users,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Server,
  Zap,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Users2,
  Plus,
  Settings,
  Mail,
} from "lucide-react";

// Types
interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalEvents: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersToday: number;
  revenueGrowth: number;
  userGrowth: number;
}

interface SystemHealth {
  api: { status: "healthy" | "degraded" | "down"; uptime: number };
  database: { status: "healthy" | "degraded" | "down"; uptime: number };
  storage: { status: "healthy" | "degraded" | "down"; uptime: number };
  email: { status: "healthy" | "degraded" | "down"; uptime: number };
  realtime: { status: "healthy" | "degraded" | "down"; uptime: number };
}

interface ActivityItem {
  id: string;
  type: "user" | "org" | "billing" | "system" | "support";
  description: string;
  timestamp: string;
  actor?: { name: string; email?: string };
}

// Mock data - replace with actual API calls
const mockStats: DashboardStats = {
  totalUsers: 12453,
  totalOrganizations: 892,
  totalEvents: 3456,
  totalRevenue: 128450,
  activeUsers: 8234,
  newUsersToday: 156,
  revenueGrowth: 23.5,
  userGrowth: 12.3,
};

const mockHealth: SystemHealth = {
  api: { status: "healthy", uptime: 99.99 },
  database: { status: "healthy", uptime: 99.95 },
  storage: { status: "healthy", uptime: 99.98 },
  email: { status: "healthy", uptime: 99.9 },
  realtime: { status: "degraded", uptime: 97.5 },
};

const mockActivities: ActivityItem[] = [
  {
    id: "1",
    type: "user",
    description: "New user registration: sarah@example.com",
    timestamp: "2024-01-15T10:30:00Z",
    actor: { name: "System" },
  },
  {
    id: "2",
    type: "billing",
    description: "Enterprise plan purchased by Acme Corp",
    timestamp: "2024-01-15T09:45:00Z",
    actor: { name: "John Smith", email: "john@acme.com" },
  },
  {
    id: "3",
    type: "org",
    description: "New organization created: 'Tech Startups Inc'",
    timestamp: "2024-01-15T09:20:00Z",
    actor: { name: "Jane Doe", email: "jane@techstartups.com" },
  },
  {
    id: "4",
    type: "support",
    description: "Support ticket #1234 resolved",
    timestamp: "2024-01-15T08:15:00Z",
    actor: { name: "Support Team" },
  },
  {
    id: "5",
    type: "system",
    description: "Scheduled maintenance completed",
    timestamp: "2024-01-15T06:00:00Z",
    actor: { name: "System" },
  },
  {
    id: "6",
    type: "user",
    description: "User account suspended: spam@example.com",
    timestamp: "2024-01-14T16:30:00Z",
    actor: { name: "Admin" },
  },
  {
    id: "7",
    type: "billing",
    description: "Refund processed: $299.00",
    timestamp: "2024-01-14T14:20:00Z",
    actor: { name: "Finance Team" },
  },
];

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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      try {
        // In production, replace with actual API calls
        // const [statsRes, healthRes, activitiesRes] = await Promise.all([
        //   fetch('/api/admin/stats'),
        //   fetch('/api/admin/health'),
        //   fetch('/api/admin/activities'),
        // ]);
        
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setStats(mockStats);
        setHealth(mockHealth);
        setActivities(mockActivities);
      } catch (error) {
        toast({
          title: "Error loading dashboard",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

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
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
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
              value={loading ? "..." : stats?.totalUsers.toLocaleString() || "0"}
              description={loading ? undefined : `${stats?.newUsersToday} new today`}
              icon={Users}
              trend={
                loading
                  ? undefined
                  : { value: stats?.userGrowth || 0, direction: "up", label: "vs last month" }
              }
              loading={loading}
              variant="default"
            />
            <StatsCard
              title="Organizations"
              value={loading ? "..." : stats?.totalOrganizations.toLocaleString() || "0"}
              icon={Building2}
              loading={loading}
              variant="info"
            />
            <StatsCard
              title="Total Events"
              value={loading ? "..." : stats?.totalEvents.toLocaleString() || "0"}
              description="Across all organizations"
              icon={Calendar}
              loading={loading}
              variant="success"
            />
            <StatsCard
              title="Revenue (MRR)"
              value={loading ? "..." : `$${stats?.totalRevenue.toLocaleString() || "0"}`}
              icon={DollarSign}
              trend={
                loading
                  ? undefined
                  : { value: stats?.revenueGrowth || 0, direction: "up", label: "vs last month" }
              }
              loading={loading}
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
              {loading ? (
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
              ) : null}
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
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Realtime service degraded</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Elevated latency detected in realtime connections
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Maintenance scheduled</p>
                  <p className="text-xs text-blue-700 mt-1">
                    System maintenance in 2 days at 02:00 UTC
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
              {loading ? (
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
              ) : (
                <div className="divide-y">
                  {activities.map((activity) => {
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
                        <StatusBadge status={activity.type} size="sm" showIcon={false} />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </Section>
      </motion.div>
    </motion.div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
