"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { useAdminUsers, useUpdateUserStatus, useDeleteUser } from "@/hooks/useAdmin";
import type { AdminUser, AdminUserDetail } from "@/lib/admin-api";
import {
  Users,
  Plus,
  UserCog,
  Ban,
  Trash2,
  Mail,
  Calendar,
  Activity,
  Shield,
  CheckCircle2,
  XCircle,
  Search,
} from "lucide-react";
import { DateRange } from "react-day-picker";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function UsersPage() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedRows, setSelectedRows] = useState<AdminUser[]>([]);
  const [filters, setFilters] = useState<FilterCondition<AdminUser>[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch users from API
  const { data: usersData, isLoading, refetch } = useAdminUsers({
    page,
    limit: pageSize,
    search: searchQuery,
  });

  const users = usersData?.users || [];
  const totalUsers = usersData?.total || 0;

  // Mutations
  const updateStatusMutation = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();

  const handleImpersonate = (user: AdminUser) => {
    toast({
      title: "Impersonating User",
      description: `You are now viewing as ${user.name} (${user.email})`,
    });
  };

  const handleSuspend = async (user: AdminUser) => {
    try {
      await updateStatusMutation.mutateAsync({ id: user.id, status: "suspended" });
      toast({
        title: "User Suspended",
        description: `${user.name} has been suspended.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBan = async (user: AdminUser) => {
    try {
      await updateStatusMutation.mutateAsync({ id: user.id, status: "banned" });
      toast({
        title: "User Banned",
        description: `${user.name} has been permanently banned.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleActivate = async (user: AdminUser) => {
    try {
      await updateStatusMutation.mutateAsync({ id: user.id, status: "active" });
      toast({
        title: "User Activated",
        description: `${user.name} has been activated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteUserMutation.mutateAsync(user.id);
      toast({
        title: "User Deleted",
        description: `${user.name} and all their data have been deleted.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkSuspend = async () => {
    try {
      await Promise.all(selectedRows.map(user => 
        updateStatusMutation.mutateAsync({ id: user.id, status: "suspended" })
      ));
      toast({
        title: "Users Suspended",
        description: `${selectedRows.length} users have been suspended.`,
      });
      setSelectedRows([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to suspend users. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.length} users? This action cannot be undone.`)) {
      return;
    }
    try {
      await Promise.all(selectedRows.map(user => deleteUserMutation.mutateAsync(user.id)));
      toast({
        title: "Users Deleted",
        description: `${selectedRows.length} users have been deleted.`,
        variant: "destructive",
      });
      setSelectedRows([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete users. Please try again.",
        variant: "destructive",
      });
    }
  };

  const columns: AdminColumn<AdminUser>[] = [
    {
      key: "name",
      header: "User",
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.name?.charAt(0) || user.email.charAt(0)}
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
      ],
    },
    {
      key: "role",
      header: "Role",
      accessor: (user) => (
        <Badge variant={user.role === "super_admin" ? "destructive" : user.role === "admin" ? "default" : "secondary"}>
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
            onSuspend: user.status === "active" ? () => handleSuspend(user) : undefined,
            onBan: user.status !== "banned" ? () => handleBan(user) : undefined,
            onActivate: user.status !== "active" ? () => handleActivate(user) : undefined,
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

      {/* Search Bar */}
      <motion.div variants={itemVariants}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <AdminDataTable
            data={users}
            columns={columns}
            keyExtractor={(user) => user.id}
            loading={isLoading}
            searchable={false} // We have custom search above
            sortable
            pagination
            pageSize={pageSize}
            currentPage={page}
            totalItems={totalUsers}
            onPageChange={setPage}
            selectable
            onSelectionChange={setSelectedRows}
            onRowClick={(user) => setSelectedUser(user)}
            filters={filters}
            onFiltersChange={setFilters}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            title={`All Users (${totalUsers})`}
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
                      {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0)}
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
                      <p className="text-sm text-muted-foreground">Locale</p>
                      <p className="text-lg font-semibold mt-1">
                        {selectedUser.locale || "en"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Account Details</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">User ID</span>
                        <span className="font-mono text-xs">{selectedUser.id}</span>
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
                    <div className="p-8 text-center text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Activity tracking coming soon</p>
                      <p className="text-sm mt-1">
                        Detailed user activity logs will be available in a future update.
                      </p>
                    </div>
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
