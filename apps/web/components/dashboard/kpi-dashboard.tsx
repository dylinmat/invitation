"use client";

import { FolderOpen, Users, Mail, CheckCircle, Calendar } from "lucide-react";
import { KPICard, KPICardsSkeleton } from "./kpi-card";
import { useDashboardStats } from "@/hooks/useDashboard";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function KPIDashboard() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (error) {
    return (
      <div
        className="rounded-xl border border-destructive/50 p-8 text-center"
        style={{ backgroundColor: "#FDF8F5" }}
      >
        <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-3" />
        <h3 className="font-semibold text-lg mb-1">Failed to load stats</h3>
        <p className="text-muted-foreground text-sm mb-4">
          We couldn&apos;t load your dashboard statistics. Please try again.
        </p>
        <Button onClick={() => refetch()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <KPICardsSkeleton count={5} />;
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
      <KPICard
        title="Total Projects"
        value={stats.totalProjects}
        trend={stats.trends.projects}
        trendLabel="vs last month"
        icon={<FolderOpen className="h-5 w-5" />}
      />
      <KPICard
        title="Total Guests"
        value={stats.totalGuests.toLocaleString()}
        trend={stats.trends.guests}
        trendLabel="vs last month"
        icon={<Users className="h-5 w-5" />}
      />
      <KPICard
        title="Invites Sent"
        value={stats.totalInvitesSent.toLocaleString()}
        trend={stats.trends.invites}
        trendLabel="vs last month"
        icon={<Mail className="h-5 w-5" />}
      />
      <KPICard
        title="RSVP Rate"
        value={`${stats.averageRSVPRate}%`}
        trend={stats.trends.rsvpRate}
        trendLabel="vs last month"
        icon={<CheckCircle className="h-5 w-5" />}
      />
      <KPICard
        title="Upcoming Events"
        value={stats.upcomingEventsCount}
        icon={<Calendar className="h-5 w-5" />}
        className="col-span-2 sm:col-span-1"
      />
    </div>
  );
}
