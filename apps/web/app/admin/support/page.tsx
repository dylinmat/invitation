"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeader } from "@/components/layout/section";
import { AdminDataTable, AdminColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatsCard, StatsGrid } from "@/components/admin/stats-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { useAdminUsers, useAdminSupportTickets } from "@/hooks/useAdmin";
import type { SupportTicket, AdminUser } from "@/lib/admin-api";
import {
  Headphones,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Search,
  User,
  Megaphone,
  RefreshCw,
  Eye,
} from "lucide-react";

// Types
interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "maintenance" | "feature";
  sentAt: string;
  recipientCount: number;
}

// Mock data for tickets until support tickets table is implemented
const mockTickets: SupportTicket[] = [
  {
    id: "TKT-001",
    subject: "Cannot access billing settings",
    description: "I'm trying to update my payment method but getting an error.",
    status: "open",
    priority: "high",
    customer: { name: "John Smith", email: "john@example.com", organization: "Acme Corp" },
    category: "Billing",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "TKT-002",
    subject: "Feature request: Custom templates",
    description: "Would love to be able to save custom invitation templates.",
    status: "waiting",
    priority: "low",
    customer: { name: "Sarah Johnson", email: "sarah@techstart.io" },
    category: "Feature Request",
    createdAt: "2024-01-14T16:45:00Z",
    updatedAt: "2024-01-15T09:20:00Z",
    assignedTo: "Support Team",
  },
  {
    id: "TKT-003",
    subject: "RSVP emails not sending",
    description: "Guests are not receiving RSVP confirmation emails.",
    status: "in_progress",
    priority: "urgent",
    customer: { name: "Mike Chen", email: "mike@design.co", organization: "Design Studio" },
    category: "Technical",
    createdAt: "2024-01-14T08:00:00Z",
    updatedAt: "2024-01-14T14:30:00Z",
    assignedTo: "Tech Team",
  },
  {
    id: "TKT-004",
    subject: "How to add multiple admins?",
    description: "Need help understanding the team roles.",
    status: "resolved",
    priority: "medium",
    customer: { name: "Emma Wilson", email: "emma@startup.com" },
    category: "How To",
    createdAt: "2024-01-13T11:00:00Z",
    updatedAt: "2024-01-13T15:30:00Z",
    assignedTo: "Support Team",
  },
];

const mockAnnouncements: SystemAnnouncement[] = [
  { id: "1", title: "New Feature: AI Guest Matching", content: "We've launched AI-powered seating arrangements...", type: "feature", sentAt: "2024-01-10T09:00:00Z", recipientCount: 12543 },
  { id: "2", title: "Scheduled Maintenance", content: "Platform will be down for maintenance on Jan 20...", type: "maintenance", sentAt: "2024-01-08T10:00:00Z", recipientCount: 12543 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function SupportPage() {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    type: "info" as SystemAnnouncement["type"],
  });
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);

  // Fetch real users for user lookup
  const { data: usersData, isLoading: isUsersLoading } = useAdminUsers({
    page: userPage,
    limit: 10,
    search: userSearch,
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;

  const tickets = mockTickets;
  const announcements = mockAnnouncements;

  const handleSendAnnouncement = () => {
    toast({
      title: "Announcement Sent",
      description: `Sent to all users: ${announcementForm.title}`,
    });
    setAnnouncementOpen(false);
    setAnnouncementForm({ title: "", content: "", type: "info" });
  };

  const handleUpdateTicketStatus = (ticketId: string, status: SupportTicket["status"]) => {
    toast({
      title: "Ticket Updated",
      description: `Ticket ${ticketId} marked as ${status}`,
    });
    setSelectedTicket(null);
  };

  const getPriorityColor = (priority: SupportTicket["priority"]) => {
    const colors: Record<string, string> = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[priority] || "bg-gray-100";
  };

  const ticketColumns: AdminColumn<SupportTicket>[] = [
    {
      key: "id",
      header: "Ticket",
      accessor: (t) => (
        <div>
          <p className="font-medium text-sm">{t.id}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{t.subject}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: "customer",
      header: "Customer",
      accessor: (t) => (
        <div>
          <p className="text-sm">{t.customer.name}</p>
          <p className="text-xs text-muted-foreground">{t.customer.organization || "No org"}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (t) => <StatusBadge status={t.status} />,
      sortable: true,
    },
    {
      key: "priority",
      header: "Priority",
      accessor: (t) => (
        <Badge variant="outline" className={getPriorityColor(t.priority)}>
          {t.priority}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      accessor: (t) => <Badge variant="secondary">{t.category}</Badge>,
      sortable: true,
    },
    {
      key: "createdAt",
      header: "Created",
      accessor: (t) => new Date(t.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      key: "actions",
      header: "",
      accessor: (t) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(t)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
      align: "right",
    },
  ];

  const stats = {
    openTickets: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    urgent: tickets.filter((t) => t.priority === "urgent").length,
  };

  const userColumns: AdminColumn<AdminUser>[] = [
    {
      key: "name",
      header: "Name",
      accessor: (u) => (
        <div>
          <p className="font-medium text-sm">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (u) => <StatusBadge status={u.status} />,
      sortable: true,
    },
    {
      key: "organizationCount",
      header: "Organizations",
      accessor: (u) => u.organizationCount,
      sortable: true,
    },
    {
      key: "lastActiveAt",
      header: "Last Active",
      accessor: (u) => u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleDateString() : "Never",
      sortable: true,
    },
    {
      key: "actions",
      header: "",
      accessor: (u) => (
        <Button variant="outline" size="sm" asChild>
          <a href={`/admin/users?search=${u.email}`}>View Profile</a>
        </Button>
      ),
      align: "right",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Support Tools"
          description="Manage support tickets and user communications"
          actions={
            <Button onClick={() => setAnnouncementOpen(true)}>
              <Megaphone className="mr-2 h-4 w-4" />
              Send Announcement
            </Button>
          }
        />
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <StatsGrid columns={4}>
          <StatsCard
            title="Open Tickets"
            value={stats.openTickets}
            icon={MessageSquare}
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon={Clock}
          />
          <StatsCard
            title="Resolved Today"
            value={stats.resolved}
            icon={CheckCircle2}
          />
          <StatsCard
            title="Urgent"
            value={stats.urgent}
            icon={AlertCircle}
            variant={stats.urgent > 0 ? "danger" : "default"}
          />
        </StatsGrid>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="tickets" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Support Tickets
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <User className="h-4 w-4" />
              User Lookup
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets">
            <Card>
              <AdminDataTable
                data={tickets}
                columns={ticketColumns}
                keyExtractor={(t) => t.id}
                loading={false}
                searchable
                sortable
                pagination
                title="Support Tickets"
              />
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Lookup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or organization..."
                    className="pl-10"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                  />
                </div>
                <AdminDataTable
                  data={users}
                  columns={userColumns}
                  keyExtractor={(u) => u.id}
                  loading={isUsersLoading}
                  searchable={false}
                  sortable
                  pagination
                  pageSize={10}
                  currentPage={userPage}
                  totalItems={totalUsers}
                  onPageChange={setUserPage}
                  title={`Users (${totalUsers})`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>System Announcements</CardTitle>
                <Button size="sm" onClick={() => setAnnouncementOpen(true)}>
                  <Send className="mr-2 h-4 w-4" />
                  New Announcement
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{a.title}</h4>
                            <Badge
                              variant={
                                a.type === "warning"
                                  ? "destructive"
                                  : a.type === "maintenance"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {a.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Sent: {new Date(a.sentAt).toLocaleDateString()}</span>
                            <span>Recipients: {a.recipientCount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTicket.id}
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">{selectedTicket.subject}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <p>{selectedTicket.customer.name}</p>
                    <p className="text-muted-foreground">{selectedTicket.customer.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <p>{selectedTicket.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, "in_progress")}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Mark In Progress
                  </Button>
                  <Button
                    onClick={() => handleUpdateTicketStatus(selectedTicket.id, "resolved")}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Resolve
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Announcement Modal */}
      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send System Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={announcementForm.type}
                onValueChange={(v) => setAnnouncementForm({ ...announcementForm, type: v as SystemAnnouncement["type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="feature">New Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="Announcement title..."
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                placeholder="Announcement message..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnouncementOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendAnnouncement} disabled={!announcementForm.title || !announcementForm.content}>
              <Send className="mr-2 h-4 w-4" />
              Send to All Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
