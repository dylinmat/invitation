"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { AdminDataTable, AdminColumn, FilterCondition } from "@/components/admin/data-table";
import { StatusBadge, UserStatusBadge } from "@/components/admin/status-badge";
import { ActionMenu, createUserActions, BulkActionBar } from "@/components/admin/action-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import {
  Users,
  Plus,
  Search,
  UserCog,
  Ban,
  Trash2,
  Mail,
  Calendar,
  Activity,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { DateRange } from "react-day-picker";

// Types
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "user" | "super_admin";
  status: "active" | "suspended" | "banned" | "unverified";
  isVerified: boolean;
  organizationCount: number;
  lastActiveAt: string;
  createdAt: string;
  loginCount: number;
}

interface UserActivity {
  id: string;
  action: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

// Mock data
const mockUsers: User[] = [
  {
    id: "1",
    email: "john@example.com",
    name: "John Smith",
    role: "user",
    status: "active",
    isVerified: true,
    organizationCount: 3,
    lastActiveAt: "2024-01-15T10:30:00Z",
    createdAt: "2023-06-15T08:00:00Z",
    loginCount: 156,
  },
  {
    id: "2",
    email: "sarah@company.com",
    name: "Sarah Johnson",
    role: "admin",
    status: "active",
    isVerified: true,
    organizationCount: 1,
    lastActiveAt: "2024-01-15T09:45:00Z",
    createdAt: "2023-08-20T14:30:00Z",
    loginCount: 89,
  },
  {
    id: "3",
    email: "mike@startup.io",
    name: "Mike Chen",
    role: "user",
    status: "suspended",
    isVerified: true,
    organizationCount: 2,
    lastActiveAt: "2024-01-10T16:20:00Z",
    createdAt: "2023-09-05T11:15:00Z",
    loginCount: 45,
  },
  {
    id: "4",
    email: "emma@design.co",
    name: "Emma Wilson",
    role: "user",
    status: "unverified",
    isVerified: false,
    organizationCount: 0,
    lastActiveAt: "",
    createdAt: "2024-01-14T20:00:00Z",
    loginCount: 0,
  },
  {
    id: "5",
    email: "alex@blocked.com",
    name: "Alex Brown",
    role: "user",
    status: "banned",
    isVerified: true,
    organizationCount: 0,
    lastActiveAt: "2023-12-01T10:00:00Z",
    createdAt: "2023-07-10T09:30:00Z",
    loginCount: 12,
  },
];

const mockActivity: UserActivity[] = [
  { id: "1", action: "Login", timestamp: "2024-01-15T10:30:00Z", ip: "192.168.1.1" },
  { id: "2", action: "Project Created", timestamp: "2024-01-15T10:35:00Z" },
  { id: "3", action: "Settings Updated", timestamp: "2024-01-14T16:20:00Z" },
  { id: "4", action: "Login", timestamp: "2024-01-14T09:00:00Z", ip: "192.168.1.1" },
  { id: "5", action: "Invitation Sent", timestamp: "2024-01-13T14:45:00Z" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRows, setSelectedRows] = useState<User[]>([]);
  const [filters, setFilters] = useState<FilterCondition<User>[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(mockUsers);
      setLoading(false);
    }, 800);
  }, []);

  const handleImpersonate = (user: User) => {
    toast({
      title: "Impersonating User",
      description: `You are now viewing as ${user.name} (${user.email})`,
    });
  };

  const handleSuspend = (user: User) => {
    toast({
      title: "User Suspended",
      description: `${user.name} has been suspended.`,
      variant: "default",
    });
  };

  const handleBan = (user: User) => {
    toast({
      title: "User Banned",
      description: `${user.name} has been permanently banned.`,
      variant: "destructive",
    });
  };

  const handleDelete = (user: User) => {
    toast({
      title: "User Deleted",
      description: `${user.name} and all their data have been deleted.`,
      variant: "destructive",
    });
  };

  const handleBulkSuspend = () => {
    toast({
      title: "Users Suspended",
      description: `${selectedRows.length} users have been suspended.`,
    });
    setSelectedRows([]);
  };

  const handleBulkDelete = () => {
    toast({
      title: "Users Deleted",
      description: `${selectedRows.length} users have been deleted.`,
      variant: "destructive",
    });
    setSelectedRows([]);
  };

  const columns: AdminColumn<User>[] = [
    {
      key: "name",
      header: "User",
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
      sortable: true,
      filterable: true,
      filterType: "text",
    },
    {
      key: "status",
      header: "Status",
      accessor: (user) => (
        <UserStatusBadge
          isActive={user.status === "active"}
          isVerified={user.isVerified}
          isBanned={user.status === "banned"}
        />
      ),
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Banned", value: "banned" },
        { label: "Unverified", value: "unverified" },
      ],
    },
    {
      key: "role",
      header: "Role",
      accessor: (user) => (
        <Badge variant={user.role === "super_admin" ? "destructive" : "secondary"}>
          {user.role}
        </Badge>
      ),
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: "Super Admin", value: "super_admin" },
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" },
      ],
    },
    {
      key: "organizationCount",
      header: "Organizations",
      accessor: (user) => user.organizationCount,
      sortable: true,
      align: "center",
    },
    {
      key: "lastActiveAt",
      header: "Last Active",
      accessor: (user) =>
        user.lastActiveAt
          ? new Date(user.lastActiveAt).toLocaleDateString()
          : "Never",
      sortable: true,
      filterable: true,
      filterType: "date",
    },
    {
      key: "createdAt",
      header: "Joined",
      accessor: (user) => new Date(user.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      key: "actions",
      header: "",
      accessor: (user) => (
        <ActionMenu
          actions={createUserActions({
            onView: () => setSelectedUser(user),
            onEdit: () => setSelectedUser(user),
            onImpersonate: () => handleImpersonate(user),
            onSuspend: () => handleSuspend(user),
            onBan: () => handleBan(user),
            onDelete: () => handleDelete(user),
          })}
        />
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
          title="User Management"
          description="Manage platform users, permissions, and access"
          actions={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          }
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <AdminDataTable
            data={users}
            columns={columns}
            keyExtractor={(user) => user.id}
            loading={loading}
            searchable
            searchKeys={["name", "email"]}
            sortable
            pagination
            pageSize={10}
            selectable
            onSelectionChange={setSelectedRows}
            onRowClick={(user) => setSelectedUser(user)}
            filters={filters}
            onFiltersChange={setFilters}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            title={`All Users (${users.length})`}
            exportFileName="users"
          />
        </Card>
      </motion.div>

      {/* Bulk Actions */}
      <BulkActionBar
        selectedCount={selectedRows.length}
        onClear={() => setSelectedRows([])}
        actions={[
          {
            id: "suspend",
            label: "Suspend",
            icon: Ban,
            onClick: handleBulkSuspend,
            variant: "warning",
          },
          {
            id: "delete",
            label: "Delete",
            icon: Trash2,
            onClick: handleBulkDelete,
            variant: "destructive",
          },
        ]}
      />

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedUser.name}</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {selectedUser.email}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1">
                        <UserStatusBadge
                          isActive={selectedUser.status === "active"}
                          isVerified={selectedUser.isVerified}
                          isBanned={selectedUser.status === "banned"}
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Role</p>
                      <Badge className="mt-1" variant={selectedUser.role === "super_admin" ? "destructive" : "secondary"}>
                        {selectedUser.role}
                      </Badge>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Organizations</p>
                      <p className="text-2xl font-semibold mt-1">
                        {selectedUser.organizationCount}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Logins</p>
                      <p className="text-2xl font-semibold mt-1">
                        {selectedUser.loginCount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Account Details</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">User ID</span>
                        <span className="font-mono">{selectedUser.id}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Joined</span>
                        <span>{new Date(selectedUser.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Last Active</span>
                        <span>
                          {selectedUser.lastActiveAt
                            ? new Date(selectedUser.lastActiveAt).toLocaleString()
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Email Verified</span>
                        <span>
                          {selectedUser.isVerified ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 inline" />
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => handleImpersonate(selectedUser)}>
                      <UserCog className="mr-2 h-4 w-4" />
                      Impersonate
                    </Button>
                    {selectedUser.status !== "banned" && (
                      <Button variant="destructive" onClick={() => handleBan(selectedUser)}>
                        <Ban className="mr-2 h-4 w-4" />
                        Ban User
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <div className="space-y-4">
                    {mockActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-lg border"
                      >
                        <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                          {activity.ip && (
                            <p className="text-xs text-muted-foreground mt-1">
                              IP: {activity.ip}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="permissions" className="mt-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Platform Role</h4>
                      <p className="text-sm text-muted-foreground">
                        This user has the <strong>{selectedUser.role}</strong> role on the platform.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Organization Access</h4>
                      <p className="text-sm text-muted-foreground">
                        Member of <strong>{selectedUser.organizationCount}</strong> organizations.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
