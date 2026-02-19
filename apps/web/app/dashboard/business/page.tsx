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
  PieChart,
  MoreHorizontal,
  Filter,
  Search,
  Building2,
  Mail,
  Phone,
  Star,
} from "lucide-react";

// Mock data for business dashboard
const clients = [
  { id: 1, name: "Smith Wedding", type: "Wedding", date: "Mar 15, 2025", status: "active", guests: 150, revenue: 5000 },
  { id: 2, name: "Johnson Birthday", type: "Birthday", date: "Apr 2, 2025", status: "active", guests: 80, revenue: 2500 },
  { id: 3, name: "Corporate Gala", type: "Corporate", date: "May 20, 2025", status: "planning", guests: 300, revenue: 12000 },
  { id: 4, name: "Anniversary Party", type: "Anniversary", date: "Jun 10, 2025", status: "planning", guests: 50, revenue: 1800 },
];

const teamMembers = [
  { id: 1, name: "Sarah Chen", role: "Lead Planner", avatar: "SC" },
  { id: 2, name: "Mike Ross", role: "Coordinator", avatar: "MR" },
  { id: 3, name: "Emma Davis", role: "Designer", avatar: "ED" },
];

const recentInvoices = [
  { id: "INV-001", client: "Smith Wedding", amount: 2500, status: "paid", date: "Jan 15, 2025" },
  { id: "INV-002", client: "Johnson Birthday", amount: 1250, status: "pending", date: "Jan 18, 2025" },
  { id: "INV-003", client: "Corporate Gala", amount: 6000, status: "pending", date: "Jan 20, 2025" },
];

const analytics = {
  totalRevenue: 21300,
  activeEvents: 4,
  totalGuests: 580,
  conversionRate: 78,
};

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

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
                <h1 className="font-bold text-gray-900">Bloom Events</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">Pro Plan</Badge>
                  <span>4 active events</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l">
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] text-white text-sm">
                    JD
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
              <h2 className="text-3xl font-bold mb-2">Welcome back, Jessica! 👋</h2>
              <p className="text-white/60 max-w-lg">
                You have 4 active events this month. Revenue is up 23% compared to last month. Great work!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Revenue", value: `$${analytics.totalRevenue.toLocaleString()}`, icon: DollarSign, change: "+23%", color: "bg-green-100 text-green-600" },
            { label: "Active Events", value: analytics.activeEvents.toString(), icon: Calendar, change: "+2", color: "bg-blue-100 text-blue-600" },
            { label: "Total Guests", value: analytics.totalGuests.toString(), icon: Users, change: "+45", color: "bg-purple-100 text-purple-600" },
            { label: "Conversion", value: `${analytics.conversionRate}%`, icon: TrendingUp, change: "+5%", color: "bg-amber-100 text-amber-600" },
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
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
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
              <Button className="bg-gray-900 hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {clients.map((client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-gray-200 hover:border-gray-300 transition-colors group cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-[#8B6B5D] transition-colors">
                            {client.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">{client.type}</p>
                        </div>
                        <Badge variant={client.status === "active" ? "default" : "secondary"}>
                          {client.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-muted-foreground text-xs">Date</p>
                          <p className="font-medium">{client.date}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Guests</p>
                          <p className="font-medium">{client.guests}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Revenue</p>
                          <p className="font-medium">${client.revenue.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Manage
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients">
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">All Clients</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button size="sm" className="bg-gray-900">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Client
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                          <p className="text-sm font-medium">{client.date}</p>
                          <p className="text-xs text-muted-foreground">Event Date</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${client.revenue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Contract Value</p>
                        </div>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Team Members</h3>
              <Button className="bg-gray-900">
                <Plus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </div>

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
                      <Button variant="outline" size="sm" className="flex-1">
                        <Mail className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Invoices</CardTitle>
                <Button size="sm" className="bg-gray-900">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
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
                          <p className="text-xs text-muted-foreground">{invoice.date}</p>
                        </div>
                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
