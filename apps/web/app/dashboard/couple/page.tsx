"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useCoupleDashboard, useChecklist, useSendReminders } from "@/hooks/useCoupleDashboard";
import { CoupleDashboardSkeleton } from "@/components/ui/skeletons/dashboard-skeleton";
import { NoGuests } from "@/components/ui/empty-states/no-guests";
import { DisabledButton } from "@/components/ui/disabled-button";
import { showToast } from "@/components/ui/toaster";
import {
  Heart,
  Users,
  Mail,
  Calendar,
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
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function CoupleDashboard() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, error, refetch } = useCoupleDashboard();
  const { items: checklistItems, toggleItem, addItem, isLoading: checklistLoading } = useChecklist();
  const sendReminders = useSendReminders();
  
  // Local state for adding custom tasks
  const [newTask, setNewTask] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Handle loading state
  if (isLoading) {
    return <CoupleDashboardSkeleton />;
  }

  // Handle error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#2C1810] mb-2">
            Failed to load dashboard
          </h2>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t load your wedding dashboard. Please try again.
          </p>
          <Button 
            onClick={() => refetch()}
            className="bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  // Handle no data state (shouldn't happen with new API, but just in case)
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDF8F5] via-white to-[#FDF8F5] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#2C1810] mb-2">
            Welcome to EIOS!
          </h2>
          <p className="text-muted-foreground mb-6">
            Let&apos;s set up your first event.
          </p>
          <Link href="/onboarding">
            <Button className="bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Extract real data
  const { event, stats, recentActivity } = dashboardData;
  const coupleNames = user?.organization?.coupleNames || { partner1: "Partner 1", partner2: "Partner 2" };
  const displayName = `${coupleNames.partner1} & ${coupleNames.partner2}`;

  // Calculate initials for avatar
  const initials = `${coupleNames.partner1[0]}${coupleNames.partner2[0]}`.toUpperCase();

  // Handle add custom task
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    setIsAddingTask(true);
    try {
      await addItem.mutateAsync(newTask.trim());
      setNewTask("");
      setShowAddTask(false);
    } finally {
      setIsAddingTask(false);
    }
  };

  // Handle send reminders
  const handleSendReminders = () => {
    if (!event?.id) {
      showToast({
        title: "No event found",
        description: "Please create an event first.",
        variant: "destructive",
      });
      return;
    }
    sendReminders.mutate({ eventId: event.id });
  };

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
                <h1 className="font-bold text-[#2C1810]">{displayName}</h1>
                <p className="text-xs text-muted-foreground">
                  {stats.daysLeft > 0 ? `${stats.daysLeft} days to go ✨` : "Your big day is here! 🎉"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                className="relative p-2 text-muted-foreground hover:text-[#8B6B5D] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {/* Only show dot if there are actual notifications */}
                {stats.rsvpRate > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              <Link href="/settings">
                <button 
                  className="p-2 text-muted-foreground hover:text-[#8B6B5D] transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-50 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-rose-600 font-semibold text-sm">{initials}</span>
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
                  <h2 className="text-3xl font-bold mb-2">Hi {coupleNames.partner1} & {coupleNames.partner2}! 👋</h2>
                  <p className="text-white/80 max-w-lg">
                    {stats.daysLeft > 30 
                      ? `Your big day is in ${stats.daysLeft} days. You've got this! 💕`
                      : stats.daysLeft > 0
                        ? `Only ${stats.daysLeft} days left! Final countdown! 🎉`
                        : "Congratulations on your wedding! 🎊"
                    }
                  </p>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-4xl font-bold">{stats.daysLeft}</div>
                  <div className="text-white/80">days left</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Guests", value: stats.guests, icon: Users, color: "bg-blue-100 text-blue-600" },
            { label: "RSVPs", value: `${stats.rsvpRate}%`, icon: CheckCircle, color: "bg-green-100 text-green-600" },
            { label: "Days Left", value: stats.daysLeft, icon: Clock, color: "bg-amber-100 text-amber-600" },
            { label: "Gifts", value: stats.gifts, icon: Gift, color: "bg-rose-100 text-rose-600" },
          ].map((stat, index) => (
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
                      <h3 className="text-xl font-bold text-[#2C1810]">{event.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.venue}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#8B6B5D]">{stats.rsvpRate}%</div>
                      <div className="text-xs text-muted-foreground">RSVP Rate</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Guest Responses</span>
                      <span className="font-medium">
                        {Math.round((stats.guests * stats.rsvpRate) / 100)} of {stats.guests}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-[#8B6B5D] to-[#D4A574]"
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.rsvpRate}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button 
                      className="flex-1 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white"
                      onClick={handleSendReminders}
                      disabled={sendReminders.isPending || stats.rsvpRate >= 100}
                    >
                      {sendReminders.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4 mr-2" />
                      )}
                      Send Reminders
                    </Button>
                    <DisabledButton reason="Guest management coming soon" comingSoon>
                      <Button variant="outline" className="flex-1 border-[#E8D5D0]">
                        <Users className="w-4 h-4 mr-2" />
                        Manage Guests
                      </Button>
                    </DisabledButton>
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
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-1">
                      {checklistLoading ? (
                        <div className="py-8 text-center text-muted-foreground">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Loading checklist...
                        </div>
                      ) : checklistItems.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                          No tasks yet. Add your first task below!
                        </div>
                      ) : (
                        checklistItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FDF8F5] transition-colors cursor-pointer group"
                            onClick={() => toggleItem.mutate({ id: item.id, completed: !item.completed })}
                          >
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                item.completed
                                  ? "bg-green-500 border-green-500"
                                  : "border-gray-300 group-hover:border-[#8B6B5D]"
                              }`}
                            >
                              {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            <span
                              className={`flex-1 transition-all ${
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
                          </motion.div>
                        ))
                      )}
                    </div>
                  </AnimatePresence>
                  
                  {/* Add Custom Task */}
                  <div className="mt-4 pt-4 border-t border-[#E8D5D0]/30">
                    {showAddTask ? (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <Input
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          placeholder="What needs to be done?"
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTask();
                            if (e.key === 'Escape') {
                              setShowAddTask(false);
                              setNewTask("");
                            }
                          }}
                        />
                        <Button 
                          size="sm"
                          onClick={handleAddTask}
                          disabled={!newTask.trim() || isAddingTask}
                        >
                          {isAddingTask ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Add"
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setShowAddTask(false);
                            setNewTask("");
                          }}
                        >
                          Cancel
                        </Button>
                      </motion.div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        className="w-full text-[#8B6B5D]"
                        onClick={() => setShowAddTask(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Custom Task
                      </Button>
                    )}
                  </div>
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
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity. Start by sending invitations!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <div className="w-8 h-8 bg-[#FDF8F5] rounded-full flex items-center justify-center flex-shrink-0">
                            {activity.type === "rsvp" && <CheckCircle className="w-4 h-4 text-green-500" />}
                            {activity.type === "gift" && <Gift className="w-4 h-4 text-rose-500" />}
                            {activity.type === "photo" && <Camera className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#2C1810]">{activity.message}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Upgrade Card - Only show if on free plan */}
            {user?.selectedPlan === "FREE" && (
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
                    <DisabledButton reason="Payment system coming soon" comingSoon>
                      <Button className="w-full bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white">
                        View Plans
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </DisabledButton>
                  </CardContent>
                </Card>
              </motion.div>
            )}

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
                    { icon: Users, label: "Import Guests", href: "#", disabled: true },
                    { icon: Mail, label: "Design Invitation", href: "#", disabled: true },
                    { icon: Gift, label: "Gift Registry", href: "#", disabled: true },
                    { icon: Camera, label: "Photo Gallery", href: "#", disabled: true },
                  ].map((action) => (
                    <div key={action.label}>
                      {action.disabled ? (
                        <DisabledButton reason={`${action.label} coming soon`} comingSoon>
                          <div className="flex items-center gap-3 p-3 rounded-lg border border-[#E8D5D0]/30 w-full text-left">
                            <action.icon className="w-5 h-5 text-[#8B6B5D]" />
                            <span className="flex-1 text-sm text-[#2C1810]">{action.label}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </DisabledButton>
                      ) : (
                        <Link
                          href={action.href}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#FDF8F5] transition-colors group"
                        >
                          <action.icon className="w-5 h-5 text-[#8B6B5D]" />
                          <span className="flex-1 text-sm text-[#2C1810]">{action.label}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </Link>
                      )}
                    </div>
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
