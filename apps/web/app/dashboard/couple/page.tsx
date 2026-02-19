"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  Heart,
  Users,
  Mail,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Sparkles,
  Gift,
  Camera,
  MapPin,
  Plus,
  Settings,
  Bell,
  ChevronRight,
  Star,
} from "lucide-react";

// Mock data for couple dashboard
const upcomingEvents = [
  {
    id: 1,
    name: "Our Wedding",
    date: "June 15, 2025",
    daysLeft: 120,
    guestCount: 150,
    rsvpRate: 68,
    image: "gradient",
  },
];

const recentActivity = [
  { type: "rsvp", message: "Sarah Chen accepted your invitation", time: "2 hours ago" },
  { type: "gift", message: "Gift registry updated", time: "5 hours ago" },
  { type: "photo", message: "3 new photos added to gallery", time: "1 day ago" },
];

const quickStats = [
  { label: "Guests", value: "102", icon: Users, color: "bg-blue-100 text-blue-600" },
  { label: "RSVPs", value: "68%", icon: CheckCircle, color: "bg-green-100 text-green-600" },
  { label: "Days Left", value: "120", icon: Clock, color: "bg-amber-100 text-amber-600" },
  { label: "Gifts", value: "24", icon: Gift, color: "bg-rose-100 text-rose-600" },
];

const checklistItems = [
  { id: 1, text: "Send invitations", completed: true },
  { id: 2, text: "Book venue", completed: true },
  { id: 3, text: "Choose caterer", completed: true },
  { id: 4, text: "Select photographer", completed: false },
  { id: 5, text: "Finalize guest list", completed: false },
  { id: 6, text: "Plan honeymoon", completed: false },
];

export default function CoupleDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8D5D0]/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-[#2C1810]">Alex & Jordan</h1>
                <p className="text-xs text-muted-foreground">120 days to go ✨</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-muted-foreground hover:text-[#8B6B5D] transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <Link href="/settings">
                <button className="p-2 text-muted-foreground hover:text-[#8B6B5D] transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-rose-600 font-semibold text-sm">A+J</span>
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
          <Card className="bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] border-none text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <CardContent className="p-8 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-white/80 text-sm font-medium">Your Wedding Dashboard</span>
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Hi Alex & Jordan! 👋</h2>
                  <p className="text-white/80 max-w-lg">
                    Your big day is approaching! You&apos;ve completed 3 of 6 major tasks. 
                    Keep up the great work! 💕
                  </p>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-4xl font-bold">120</div>
                  <div className="text-white/80">days left</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-[#E8D5D0]/50 hover:border-[#8B6B5D]/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#2C1810]">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-[#E8D5D0]/50 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-rose-100 via-amber-50 to-rose-100 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Heart className="w-16 h-16 text-rose-200" />
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#2C1810]">Our Wedding</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          June 15, 2025
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Garden Venue
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#8B6B5D]">68%</div>
                      <div className="text-xs text-muted-foreground">RSVP Rate</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Guest Responses</span>
                      <span className="font-medium">102 of 150</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button className="flex-1 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Reminders
                    </Button>
                    <Button variant="outline" className="flex-1 border-[#E8D5D0]">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Guests
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-[#E8D5D0]/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="w-5 h-5 text-[#8B6B5D]" />
                    Wedding Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {checklistItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FDF8F5] transition-colors cursor-pointer"
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            item.completed
                              ? "bg-green-500 border-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span
                          className={`flex-1 ${
                            item.completed ? "text-muted-foreground line-through" : "text-[#2C1810]"
                          }`}
                        >
                          {item.text}
                        </span>
                        {!item.completed && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-4 text-[#8B6B5D]">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Custom Task
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-[#E8D5D0]/50">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-[#FDF8F5] rounded-full flex items-center justify-center flex-shrink-0">
                          {activity.type === "rsvp" && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {activity.type === "gift" && <Gift className="w-4 h-4 text-rose-500" />}
                          {activity.type === "photo" && <Camera className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#2C1810]">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Upgrade Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-amber-50 to-rose-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-[#2C1810]">Upgrade to Premium</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlock custom designs, photo galleries, and unlimited guests.
                  </p>
                  <Button className="w-full bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white">
                    View Plans
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-[#E8D5D0]/50">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { icon: Users, label: "Import Guests", href: "#" },
                    { icon: Mail, label: "Design Invitation", href: "#" },
                    { icon: Gift, label: "Gift Registry", href: "#" },
                    { icon: Camera, label: "Photo Gallery", href: "#" },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FDF8F5] transition-colors group"
                    >
                      <action.icon className="w-5 h-5 text-[#8B6B5D]" />
                      <span className="flex-1 text-sm text-[#2C1810]">{action.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
