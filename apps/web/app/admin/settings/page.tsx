"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeader } from "@/components/layout/section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/useToast";
import {
  Settings,
  Save,
  ToggleLeft,
  Mail,
  Shield,
  Server,
  AlertTriangle,
  RefreshCw,
  Globe,
  Lock,
  Zap,
  Bell,
} from "lucide-react";

// Types
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "core" | "experimental" | "beta" | "deprecated";
}

interface SystemConfig {
  siteName: string;
  supportEmail: string;
  maxUploadSize: number;
  defaultTimezone: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
}

interface RateLimitConfig {
  apiRequestsPerMinute: number;
  authAttemptsPerHour: number;
  emailSendsPerHour: number;
  fileUploadsPerHour: number;
}

// Mock data
const mockFeatureFlags: FeatureFlag[] = [
  { id: "1", name: "New Dashboard UI", description: "Enable the redesigned dashboard interface", enabled: true, category: "core" },
  { id: "2", name: "AI Guest Matching", description: "Use AI to suggest optimal seating arrangements", enabled: false, category: "beta" },
  { id: "3", name: "Advanced Analytics", description: "Enhanced analytics with custom reports", enabled: true, category: "core" },
  { id: "4", name: "White Label Sites", description: "Allow custom domains for event sites", enabled: true, category: "core" },
  { id: "5", name: "Video Invitations", description: "Create video-based invitations", enabled: false, category: "experimental" },
  { id: "6", name: "Old RSVP Flow", description: "Legacy RSVP system (deprecated)", enabled: false, category: "deprecated" },
  { id: "7", name: "Batch Operations", description: "Bulk actions for guests and invites", enabled: true, category: "core" },
  { id: "8", name: "SMS Notifications", description: "Send SMS updates to guests", enabled: false, category: "beta" },
];

const mockConfig: SystemConfig = {
  siteName: "EIOS - Event Invitation OS",
  supportEmail: "support@eios.app",
  maxUploadSize: 10,
  defaultTimezone: "UTC",
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
};

const mockRateLimits: RateLimitConfig = {
  apiRequestsPerMinute: 100,
  authAttemptsPerHour: 10,
  emailSendsPerHour: 50,
  fileUploadsPerHour: 20,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [config, setConfig] = useState<SystemConfig>(mockConfig);
  const [rateLimits, setRateLimits] = useState<RateLimitConfig>(mockRateLimits);
  const { toast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      setFeatureFlags(mockFeatureFlags);
      setLoading(false);
    }, 500);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    toast({
      title: "Settings Saved",
      description: "Your changes have been saved successfully.",
    });
  };

  const toggleFeature = (id: string) => {
    setFeatureFlags((flags) =>
      flags.map((flag) =>
        flag.id === id ? { ...flag, enabled: !flag.enabled } : flag
      )
    );
  };

  const getCategoryColor = (category: FeatureFlag["category"]) => {
    const colors: Record<string, string> = {
      core: "bg-blue-100 text-blue-800",
      experimental: "bg-purple-100 text-purple-800",
      beta: "bg-yellow-100 text-yellow-800",
      deprecated: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="System Settings"
          description="Configure platform-wide settings and features"
          actions={
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="features" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="features" className="gap-2">
              <ToggleLeft className="h-4 w-4" />
              Feature Flags
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
          </TabsList>

          {/* Feature Flags Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Feature Flags
                </CardTitle>
                <CardDescription>
                  Enable or disable platform features. Changes take effect immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <div className="space-y-1">
                          <div className="h-4 w-32 bg-muted rounded" />
                          <div className="h-3 w-48 bg-muted rounded" />
                        </div>
                        <div className="h-6 w-11 bg-muted rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {["core", "beta", "experimental", "deprecated"].map((category) => {
                      const flags = featureFlags.filter((f) => f.category === category);
                      if (flags.length === 0) return null;

                      return (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                            {category} Features
                          </h4>
                          <div className="space-y-3">
                            {flags.map((flag) => (
                              <div
                                key={flag.id}
                                className="flex items-center justify-between py-3 border-b last:border-0"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{flag.name}</span>
                                    <Badge
                                      variant="secondary"
                                      className={getCategoryColor(flag.category)}
                                    >
                                      {flag.category}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {flag.description}
                                  </p>
                                </div>
                                <Switch
                                  checked={flag.enabled}
                                  onCheckedChange={() => toggleFeature(flag.id)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={config.siteName}
                      onChange={(e) => setConfig({ ...config, siteName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={config.supportEmail}
                      onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxUploadSize">
                      Max Upload Size (MB)
                    </Label>
                    <Input
                      id="maxUploadSize"
                      type="number"
                      value={config.maxUploadSize}
                      onChange={(e) =>
                        setConfig({ ...config, maxUploadSize: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Input
                      id="timezone"
                      value={config.defaultTimezone}
                      onChange={(e) => setConfig({ ...config, defaultTimezone: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Platform Options</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Show maintenance page to all users
                      </p>
                    </div>
                    <Switch
                      checked={config.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, maintenanceMode: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Registration</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new users to sign up
                      </p>
                    </div>
                    <Switch
                      checked={config.registrationEnabled}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, registrationEnabled: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Rate Limiting
                </CardTitle>
                <CardDescription>
                  Configure API and resource rate limits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="apiRequests">API Requests per Minute</Label>
                    <Input
                      id="apiRequests"
                      type="number"
                      value={rateLimits.apiRequestsPerMinute}
                      onChange={(e) =>
                        setRateLimits({
                          ...rateLimits,
                          apiRequestsPerMinute: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="authAttempts">Auth Attempts per Hour</Label>
                    <Input
                      id="authAttempts"
                      type="number"
                      value={rateLimits.authAttemptsPerHour}
                      onChange={(e) =>
                        setRateLimits({
                          ...rateLimits,
                          authAttemptsPerHour: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="emailSends">Email Sends per Hour</Label>
                    <Input
                      id="emailSends"
                      type="number"
                      value={rateLimits.emailSendsPerHour}
                      onChange={(e) =>
                        setRateLimits({
                          ...rateLimits,
                          emailSendsPerHour: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fileUploads">File Uploads per Hour</Label>
                    <Input
                      id="fileUploads"
                      type="number"
                      value={rateLimits.fileUploadsPerHour}
                      onChange={(e) =>
                        setRateLimits({
                          ...rateLimits,
                          fileUploadsPerHour: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Verification Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require email verification before account activation
                    </p>
                  </div>
                  <Switch
                    checked={config.emailVerificationRequired}
                    onCheckedChange={(checked) =>
                      setConfig({ ...config, emailVerificationRequired: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Templates
                </CardTitle>
                <CardDescription>
                  Customize email templates for system notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Welcome Email", "Password Reset", "Invitation", "Payment Receipt", "Account Suspension"].map(
                    (template) => (
                      <div
                        key={template}
                        className="flex items-center justify-between py-3 border-b last:border-0"
                      >
                        <div>
                          <p className="font-medium">{template}</p>
                          <p className="text-sm text-muted-foreground">
                            Last edited 2 days ago
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit Template
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
