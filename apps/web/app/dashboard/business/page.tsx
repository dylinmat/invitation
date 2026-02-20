"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useBusinessDashboard, useCreateEvent } from "@/hooks/useBusinessDashboard";
import { BusinessDashboardSkeleton } from "@/components/ui/skeletons/dashboard-skeleton";
import { DisabledButton } from "@/components/ui/disabled-button";
import { showToast } from "@/components/ui/toaster";
import {
  Briefcase,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Clock,
  Sparkles,
  Plus,
  Settings,
  Bell,
  ChevronRight,
  BarChart3,
  MoreHorizontal,
  Filter,
  Building2,
  Mail,
  Phone,
  Star,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function BusinessDashboard() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, error, refetch } = useBusinessDashboard();
  const createEvent = useCreateEvent();
  const [activeTab, setActiveTab] = useState("events");
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  // Handle loading state
  if (isLoading) {
    return <BusinessDashboardSkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Failed to load dashboard
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t load your business dashboard. Please try again.
          </p>
          <Button 
            onClick={() => refetch()}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  // Handle no data state
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to EIOS Pro!
          </h2>
          <p className="text-gray-600 mb-6">
            Let&apos;s set up your business profile.
          </p>
          <Link href="/onboarding">
            <Button className="bg-gray-900 hover:bg-gray-800">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { clients, events, teamMembers, invoices, analytics } = dashboardData;
  const businessName = user?.organization?.name || "Your Business";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{businessName}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">{user?.selectedPlan || "Free"} Plan</Badge>
                  <span>{analytics.activeEvents} active events</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {invoices.some(i => i.status === "pending") && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <button 
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] text-white text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('') || "ME"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-white/60 text-sm font-medium">Business Dashboard</span>
              </div>
              <h2 className="text-3xl font-bold mb-2">Welcome back! 👋</h2>
              <p className="text-white/60 max-w-lg">
                You have {analytics.activeEvents} active events. 
                {analytics.totalRevenue > 0 
                  ? ` Total revenue: $${analytics.totalRevenue.toLocaleString()}.`
                  : " Start adding events to see your revenue grow!"
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: `$${analytics.totalRevenue.toLocaleString()}`, icon: DollarSign, change: "+23%" },
            { label: "Active Events", value: analytics.activeEvents.toString(), icon: Calendar, change: "+2" },
            { label: "Total Guests", value: analytics.totalGuests.toLocaleString(), icon: Users, change: "+45" },
            { label: "Conversion", value: `${analytics.conversionRate}%`, icon: TrendingUp, change: "+5%" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <stat.icon className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Active Events</h3>
              <Button 
                className="bg-gray-900 hover:bg-gray-800"
                onClick={() => setShowNewEventModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </div>

            {events.length === 0 ? (
              <Card className="border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 mb-4">Create your first event to get started.</p>
                <Button 
                  className="bg-gray-900 hover:bg-gray-800"
                  onClick={() => setShowNewEventModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-gray-200 hover:border-gray-300 transition-colors group cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-[#8B6B5D] transition-colors">
                              {event.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">{event.type}</p>
                          </div>
                          <Badge variant={event.status === "active" ? "default" : "secondary"}>
                            {event.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground text-xs">Date</p>
                            <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Guests</p>
                            <p className="font-medium">{event.guests}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Revenue</p>
                            <p className="font-medium">${event.revenue.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DisabledButton reason="Event management coming soon" comingSoon>
                            <Button variant="outline" size="sm" className="flex-1">
                              Manage
                            </Button>
                          </DisabledButton>
                          <DisabledButton reason="More options coming soon" comingSoon>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DisabledButton>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">All Clients</CardTitle>
                <div className="flex items-center gap-2">
                  <DisabledButton reason="Filters coming soon" comingSoon>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </DisabledButton>
                  <DisabledButton reason="Client creation coming soon" comingSoon>
                    <Button size="sm" className="bg-gray-900">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </Button>
                  </DisabledButton>
                </div>
              </CardHeader>
              <CardContent>
                {clients.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients yet</h3>
                    <p className="text-gray-600">Add your first client to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-sm">
                              {client.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.type}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-medium">{new Date(client.date).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">Event Date</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${client.revenue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">Contract Value</p>
                          </div>
                          <DisabledButton reason="Client details coming soon" comingSoon>
                            <Button variant="ghost" size="icon">
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </DisabledButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <DisabledButton reason="Team invitations coming soon" comingSoon>
                <Button className="bg-gray-900">
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              </DisabledButton>
            </div>

            {teamMembers.length === 0 ? (
              <Card className="border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members</h3>
                <p className="text-gray-600 mb-4">Invite your team to collaborate on events.</p>
                <DisabledButton reason="Team invitations coming soon" comingSoon>
                  <Button className="bg-gray-900">
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </DisabledButton>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {teamMembers.map((member) => (
                  <Card key={member.id} className="border-gray-200">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] text-white">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <DisabledButton reason="Messaging coming soon" comingSoon>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Mail className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                        </DisabledButton>
                        <DisabledButton reason="More options coming soon" comingSoon>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DisabledButton>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Invoices</CardTitle>
                <DisabledButton reason="Invoice creation coming soon" comingSoon>
                  <Button size="sm" className="bg-gray-900">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Invoice
                  </Button>
                </DisabledButton>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
                    <p className="text-gray-600">Create your first invoice to get paid.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{invoice.id}</p>
                            <p className="text-sm text-muted-foreground">{invoice.client}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="font-medium">${invoice.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(invoice.date).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
