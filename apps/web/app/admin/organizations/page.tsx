"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { AdminDataTable, AdminColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { ActionMenu, createOrgActions, BulkActionBar } from "@/components/admin/action-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { useAdminOrganizations, useArchiveOrganization, useDeleteOrganization } from "@/hooks/useAdmin";
import type { AdminOrganization } from "@/lib/admin-api";
import {
  Building2,
  Plus,
  Users,
  Calendar,
  UserCog,
  Archive,
  Trash2,
  Search,
} from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function OrganizationsPage() {
  const { toast } = useToast();
  const [selectedOrg, setSelectedOrg] = useState<AdminOrganization | null>(null);
  const [selectedRows, setSelectedRows] = useState<AdminOrganization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch organizations from API
  const { data: orgsData, isLoading, refetch } = useAdminOrganizations({
    page,
    limit: pageSize,
    search: searchQuery,
  });

  const organizations = orgsData?.organizations || [];
  const totalOrganizations = orgsData?.total || 0;

  // Mutations
  const archiveOrgMutation = useArchiveOrganization();
  const deleteOrgMutation = useDeleteOrganization();

  const handleArchive = async (org: AdminOrganization) => {
    try {
      await archiveOrgMutation.mutateAsync(org.id);
      toast({
        title: "Organization Archived",
        description: `${org.name} has been archived.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive organization. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTransfer = (org: AdminOrganization) => {
    toast({
      title: "Transfer Ownership",
      description: `Initiated ownership transfer for ${org.name}.`,
    });
  };

  const handleDelete = async (org: AdminOrganization) => {
    if (!confirm(`Are you sure you want to delete ${org.name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteOrgMutation.mutateAsync(org.id);
      toast({
        title: "Organization Deleted",
        description: `${org.name} has been permanently deleted.`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete organization. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkArchive = async () => {
    try {
      await Promise.all(selectedRows.map(org => archiveOrgMutation.mutateAsync(org.id)));
      toast({
        title: "Organizations Archived",
        description: `${selectedRows.length} organizations archived.`,
      });
      setSelectedRows([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive organizations. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRows.length} organizations? This action cannot be undone.`)) {
      return;
    }
    try {
      await Promise.all(selectedRows.map(org => deleteOrgMutation.mutateAsync(org.id)));
      toast({
        title: "Organizations Deleted",
        description: `${selectedRows.length} organizations deleted.`,
        variant: "destructive",
      });
      setSelectedRows([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete organizations. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      free: "secondary",
      pro: "default",
      enterprise: "destructive",
    };
    return (
      <Badge variant={variants[plan] || "secondary"} className="capitalize">
        {plan}
      </Badge>
    );
  };

  const columns: AdminColumn<AdminOrganization>[] = [
    {
      key: "name",
      header: "Organization",
      accessor: (org) => (
        <div>
          <p className="font-medium text-sm">{org.name}</p>
          <p className="text-xs text-muted-foreground">@{org.slug}</p>
        </div>
      ),
      sortable: true,
      filterable: true,
      filterType: "text",
    },
    {
      key: "type",
      header: "Type",
      accessor: (org) => (
        <Badge variant="outline" className="uppercase text-xs">
          {org.type}
        </Badge>
      ),
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: "Couple", value: "COUPLE" },
        { label: "Planner", value: "PLANNER" },
        { label: "Venue", value: "VENUE" },
      ],
    },
    {
      key: "plan",
      header: "Plan",
      accessor: (org) => getPlanBadge(org.plan),
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: "Free", value: "free" },
        { label: "Pro", value: "pro" },
        { label: "Enterprise", value: "enterprise" },
      ],
    },
    {
      key: "status",
      header: "Status",
      accessor: (org) => <StatusBadge status={org.status} />,
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: "Active", value: "active" },
        { label: "Suspended", value: "suspended" },
        { label: "Archived", value: "archived" },
      ],
    },
    {
      key: "memberCount",
      header: "Members",
      accessor: (org) => (
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{org.memberCount}</span>
        </div>
      ),
      sortable: true,
      align: "center",
    },
    {
      key: "projectCount",
      header: "Projects",
      accessor: (org) => org.projectCount,
      sortable: true,
      align: "center",
    },
    {
      key: "owner",
      header: "Owner",
      accessor: (org) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {org.owner.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm truncate max-w-[120px]">{org.owner.email}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "createdAt",
      header: "Created",
      accessor: (org) => new Date(org.createdAt).toLocaleDateString(),
      sortable: true,
    },
    {
      key: "actions",
      header: "",
      accessor: (org) => (
        <ActionMenu
          actions={createOrgActions({
            onView: () => setSelectedOrg(org),
            onEdit: () => setSelectedOrg(org),
            onArchive: () => handleArchive(org),
            onTransfer: () => handleTransfer(org),
            onDelete: () => handleDelete(org),
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
          title="Organizations"
          description="Manage platform organizations and their settings"
          actions={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          }
        />
      </motion.div>

      {/* Search Bar */}
      <motion.div variants={itemVariants}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations by name..."
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
            data={organizations}
            columns={columns}
            keyExtractor={(org) => org.id}
            loading={isLoading}
            searchable={false} // We have custom search above
            sortable
            pagination
            pageSize={pageSize}
            currentPage={page}
            totalItems={totalOrganizations}
            onPageChange={setPage}
            selectable
            onSelectionChange={setSelectedRows}
            onRowClick={(org) => setSelectedOrg(org)}
            title={`All Organizations (${totalOrganizations})`}
            exportFileName="organizations"
          />
        </Card>
      </motion.div>

      <BulkActionBar
        selectedCount={selectedRows.length}
        onClear={() => setSelectedRows([])}
        actions={[
          {
            id: "archive",
            label: "Archive",
            icon: Archive,
            onClick: handleBulkArchive,
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

      {/* Organization Details Modal */}
      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrg && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p>{selectedOrg.name}</p>
                    <p className="text-sm font-normal text-muted-foreground">
                      @{selectedOrg.slug}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="mt-1">
                        <StatusBadge status={selectedOrg.status} />
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <div className="mt-1">{getPlanBadge(selectedOrg.plan)}</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Members</p>
                      <p className="text-2xl font-semibold mt-1">
                        {selectedOrg.memberCount}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Projects</p>
                      <p className="text-2xl font-semibold mt-1">
                        {selectedOrg.projectCount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Organization Details</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Organization ID</span>
                        <span className="font-mono text-xs">{selectedOrg.id}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Created</span>
                        <span>{new Date(selectedOrg.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Type</span>
                        <Badge variant="outline" className="uppercase">{selectedOrg.type}</Badge>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Owner</span>
                        <span>{selectedOrg.owner.email}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="members" className="mt-4">
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Organization members</p>
                    <p className="text-sm mt-1">
                      This organization has {selectedOrg.memberCount} member(s).
                    </p>
                    <Button className="mt-4" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      View All Members
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Transfer Ownership</p>
                        <p className="text-sm text-muted-foreground">
                          Transfer this organization to another user
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => handleTransfer(selectedOrg)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Transfer
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">Archive Organization</p>
                        <p className="text-sm text-muted-foreground">
                          Temporarily disable this organization
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => handleArchive(selectedOrg)}>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-red-900">Delete Organization</p>
                        <p className="text-sm text-red-700">
                          Permanently delete this organization and all its data
                        </p>
                      </div>
                      <Button variant="destructive" onClick={() => handleDelete(selectedOrg)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
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
