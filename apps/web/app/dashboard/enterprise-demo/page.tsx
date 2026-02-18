"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Command,
  Bell,
  Activity,
  Search,
  User,
  CheckSquare,
  Sparkles,
  Zap,
  Keyboard,
  Plus,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardNav } from "@/components/dashboard/nav";
import { ActivityFeed } from "@/components/activity-feed";
import { useNotify } from "@/components/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function EnterpriseDemoPage() {
  const notify = useNotify();
  const [activeTab, setActiveTab] = useState("overview");

  const showNotification = (type: "success" | "error" | "warning" | "info") => {
    switch (type) {
      case "success":
        notify.success("Success!", "Your changes have been saved successfully.");
        break;
      case "error":
        notify.error("Error occurred", "Something went wrong. Please try again.");
        break;
      case "warning":
        notify.warning("Warning", "Please review your settings before continuing.");
        break;
      case "info":
        notify.info("Did you know?", "You can use keyboard shortcuts for faster navigation.");
        break;
    }
  };

  const showNotificationWithAction = () => {
    const { notify: showToast } = require("@/components/notifications").useNotifications();
    showToast({
      type: "info",
      title: "New Feature Available",
      message: "Check out our new activity feed feature!",
      duration: 10000,
      actions: [
        {
          label: "Try it now",
          onClick: () => setActiveTab("activity"),
        },
        {
          label: "Learn more",
          onClick: () => window.open("/docs/activity-feed", "_blank"),
        },
      ],
    });
  };

  const features = [
    {
      id: "command-palette",
      title: "Command Palette",
      description: "Quick access to all actions with Cmd/Ctrl + K",
      icon: <Command className="w-6 h-6" />,
      shortcut: "⌘K",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Smart toast notifications with actions",
      icon: <Bell className="w-6 h-6" />,
      shortcut: "",
      color: "from-green-500 to-green-600",
    },
    {
      id: "activity-feed",
      title: "Activity Feed",
      description: "Track all your project activities in real-time",
      icon: <Activity className="w-6 h-6" />,
      shortcut: "",
      color: "from-purple-500 to-purple-600",
    },
    {
      id: "global-search",
      title: "Global Search",
      description: "Search across projects, guests, and invites",
      icon: <Search className="w-6 h-6" />,
      shortcut: "⌘/",
      color: "from-amber-500 to-amber-600",
    },
    {
      id: "user-menu",
      title: "Enhanced User Menu",
      description: "Organization switcher, theme toggle, and shortcuts",
      icon: <User className="w-6 h-6" />,
      shortcut: "",
      color: "from-rose-500 to-rose-600",
    },
    {
      id: "onboarding",
      title: "Onboarding Checklist",
      description: "Guided setup for new users",
      icon: <CheckSquare className="w-6 h-6" />,
      shortcut: "",
      color: "from-teal-500 to-teal-600",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {/* Hero Section */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="p-2 bg-gradient-to-br from-rose-500 to-rose-600 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-serif">
                  Enterprise Features
                </h1>
                <p className="text-muted-foreground">
                  Experience the new command palette, notifications, and more
                </p>
              </div>
            </motion.div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="activity">Activity Feed</TabsTrigger>
              <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="group h-full hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-rose-200">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div
                            className={cn(
                              "p-3 rounded-xl bg-gradient-to-br text-white shadow-lg",
                              feature.color
                            )}
                          >
                            {feature.icon}
                          </div>
                          {feature.shortcut && (
                            <kbd className="px-2 py-1 text-xs bg-muted rounded border">
                              {feature.shortcut}
                            </kbd>
                          )}
                        </div>
                        <CardTitle className="mt-4">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant="ghost"
                          className="w-full group-hover:bg-rose-50 group-hover:text-rose-600"
                          onClick={() => {
                            if (feature.id === "command-palette") {
                              // Trigger command palette via keyboard shortcut
                              const event = new KeyboardEvent("keydown", {
                                key: "k",
                                metaKey: true,
                              });
                              window.dispatchEvent(event);
                            }
                          }}
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Try it now
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Test the new features instantly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => {
                        const event = new KeyboardEvent("keydown", {
                          key: "k",
                          metaKey: true,
                        });
                        window.dispatchEvent(event);
                      }}
                    >
                      <Command className="w-4 h-4 mr-2" />
                      Open Command Palette
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const event = new KeyboardEvent("keydown", {
                          key: "k",
                          metaKey: true,
                        });
                        window.dispatchEvent(event);
                      }}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Open Global Search
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notification System
                  </CardTitle>
                  <CardDescription>
                    Test different notification types with actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Notifications */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Basic Notifications</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => showNotification("success")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Success
                      </Button>
                      <Button
                        onClick={() => showNotification("error")}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Error
                      </Button>
                      <Button
                        onClick={() => showNotification("warning")}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Warning
                      </Button>
                      <Button
                        onClick={() => showNotification("info")}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Info className="w-4 h-4 mr-2" />
                        Info
                      </Button>
                    </div>
                  </div>

                  {/* Notification with Actions */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      Notifications with Actions
                    </h3>
                    <Button onClick={showNotificationWithAction} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Show Action Notification
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="w-4 h-4 text-rose-500" />
                          <span className="font-medium">Smart Positioning</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Top-right on desktop, bottom-center on mobile
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="font-medium">Auto-dismiss</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          5 second default, pauses on hover
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Actions</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Add custom action buttons to notifications
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-dashed">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-green-500" />
                          <span className="font-medium">Swipe Dismiss</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Swipe right to dismiss on mobile
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Feed Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activity Feed
                  </CardTitle>
                  <CardDescription>
                    Timeline view with filtering and infinite scroll
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ActivityFeed />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shortcuts Tab */}
            <TabsContent value="shortcuts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5" />
                    Keyboard Shortcuts
                  </CardTitle>
                  <CardDescription>
                    Navigate faster with keyboard shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Command Palette Shortcuts */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Command Palette
                      </h3>
                      <div className="space-y-2">
                        {[
                          { key: "⌘ K", desc: "Open command palette" },
                          { key: "↑ ↓", desc: "Navigate results" },
                          { key: "↵", desc: "Select action" },
                          { key: "Esc", desc: "Close palette" },
                        ].map((shortcut) => (
                          <div
                            key={shortcut.key}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <span className="text-sm">{shortcut.desc}</span>
                            <kbd className="px-2 py-1 text-sm bg-muted rounded border font-mono">
                              {shortcut.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Navigation Shortcuts */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Navigation
                      </h3>
                      <div className="space-y-2">
                        {[
                          { key: "G then D", desc: "Go to Dashboard" },
                          { key: "G then P", desc: "Go to Projects" },
                          { key: "G then S", desc: "Go to Settings" },
                          { key: "C then P", desc: "Create Project" },
                        ].map((shortcut) => (
                          <div
                            key={shortcut.key}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <span className="text-sm">{shortcut.desc}</span>
                            <kbd className="px-2 py-1 text-sm bg-muted rounded border font-mono">
                              {shortcut.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Search Shortcuts */}
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">
                        Global Search
                      </h3>
                      <div className="space-y-2">
                        {[
                          { key: "P", desc: "Filter to Projects" },
                          { key: "G", desc: "Filter to Guests" },
                          { key: "I", desc: "Filter to Invites" },
                          { key: "S", desc: "Filter to Settings" },
                        ].map((shortcut) => (
                          <div
                            key={shortcut.key}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <span className="text-sm">{shortcut.desc}</span>
                            <kbd className="px-2 py-1 text-sm bg-muted rounded border font-mono">
                              {shortcut.key}
                            </kbd>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
