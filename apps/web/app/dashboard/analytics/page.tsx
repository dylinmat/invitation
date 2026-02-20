"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBusinessDashboard } from "@/hooks/useBusinessDashboard";
import { BusinessDashboardSkeleton } from "@/components/ui/skeletons/dashboard-skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

// Mock data for charts - would come from API in production
const rsvpTrendData = [
  { month: "Jan", yes: 12, no: 2, pending: 45 },
  { month: "Feb", yes: 25, no: 5, pending: 38 },
  { month: "Mar", yes: 45, no: 8, pending: 30 },
  { month: "Apr", yes: 78, no: 12, pending: 20 },
  { month: "May", yes: 102, no: 15, pending: 15 },
  { month: "Jun", yes: 120, no: 18, pending: 12 },
];

const eventTypeData = [
  { name: "Wedding", value: 45, color: "#8B6B5D" },
  { name: "Birthday", value: 25, color: "#D4A574" },
  { name: "Corporate", value: 20, color: "#E8D5D0" },
  { name: "Other", value: 10, color: "#FDF8F5" },
];

const revenueData = [
  { month: "Jan", revenue: 2500 },
  { month: "Feb", revenue: 4200 },
  { month: "Mar", revenue: 6800 },
  { month: "Apr", revenue: 8900 },
  { month: "May", revenue: 12400 },
  { month: "Jun", revenue: 15600 },
];

export default function AnalyticsPage() {
  const { data: dashboardData, isLoading } = useBusinessDashboard();

  if (isLoading) {
    return <BusinessDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/business">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-muted-foreground">
                  Insights into your events and guests
                </p>
              </div>
            </div>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Events",
              value: dashboardData?.analytics.activeEvents || 0,
              icon: Calendar,
              change: "+12%",
            },
            {
              label: "Total Guests",
              value: dashboardData?.analytics.totalGuests || 0,
              icon: Users,
              change: "+8%",
            },
            {
              label: "Revenue",
              value: `$${(dashboardData?.analytics.totalRevenue || 0).toLocaleString()}`,
              icon: DollarSign,
              change: "+23%",
            },
            {
              label: "Avg. Response Rate",
              value: `${dashboardData?.analytics.conversionRate || 0}%`,
              icon: TrendingUp,
              change: "+5%",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                      <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
                    </div>
                    <stat.icon className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RSVP Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle>RSVP Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rsvpTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D5D0" />
                    <XAxis dataKey="month" stroke="#8B6B5D" />
                    <YAxis stroke="#8B6B5D" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#fff", 
                        border: "1px solid #E8D5D0",
                        borderRadius: "8px"
                      }} 
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="yes"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="Accepted"
                    />
                    <Line
                      type="monotone"
                      dataKey="no"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Declined"
                    />
                    <Line
                      type="monotone"
                      dataKey="pending"
                      stroke="#D4A574"
                      strokeWidth={2}
                      name="Pending"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle>Revenue Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8D5D0" />
                    <XAxis dataKey="month" stroke="#8B6B5D" />
                    <YAxis stroke="#8B6B5D" />
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #E8D5D0",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="url(#colorRevenue)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B6B5D" stopOpacity={1} />
                        <stop offset="95%" stopColor="#D4A574" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-[350px]">
              <CardHeader>
                <CardTitle>Event Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={eventTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {eventTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Clients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="lg:col-span-2"
          >
            <Card className="h-[350px]">
              <CardHeader>
                <CardTitle>Top Clients by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.clients
                    ?.slice(0, 5)
                    .map((client, index) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {client.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${client.revenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {client.guests} guests
                          </p>
                        </div>
                      </div>
                    )) || (
                    <p className="text-center text-muted-foreground py-8">
                      No client data available
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
