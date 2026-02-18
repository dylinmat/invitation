"use client";

import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/useToast";
import {
  Building2,
  Plus,
  Users,
  Calendar,
  CreditCard,
  Settings,
  UserCog,
  Mail,
  Activity,
  TrendingUp,
  Archive,
  Trash2,
} from "lucide-react";

// Types
interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "suspended" | "archived";
  memberCount: number;
  projectCount: number;
  owner: {
    name: string;
    email: string;
  };
  createdAt: string;
  lastActiveAt: string;
  monthlyRevenue: number;
}

// Mock data
const mockOrganizations: Organization[] = [
  {
    id: "1",
    name: "Acme Corporation",
    slug: "acme-corp",
    plan: "enterprise",
    status: "active",
    memberCount: 45,
    projectCount: 12,
    owner: { name: "John Smith", email: "john@acme.com" },
    createdAt: "2023-01-15T08:00:00Z",
    lastActiveAt: "2024-01-15T10:30:00Z",
    monthlyRevenue: 999,
  },
  {
    id: "2",
    name: "TechStart Inc",
    slug: "techstart",
    plan: "pro",
    status: "active",
    memberCount: 12,
    projectCount: 5,
    owner: { name: "Sarah Johnson", email: "sarah@techstart.io" },
    createdAt: "2023-03-20T14:30:00Z",
    lastActiveAt: "2024-01-14T16:45:00Z",
    monthlyRevenue: 199,
  },
  {
    id: "3",
    name: "Design Studio Co",
    slug: "design-studio",
    plan: "free",
    status: "active",
    memberCount: 3,
    projectCount: 8,
    owner: { name: "Mike Chen", email: "mike@design.co" },
    createdAt: "2023-06-10T11:15:00Z",
    lastActiveAt: "2024-01-10T09:20:00Z",
    monthlyRevenue: 0,
  },
  {
    id: "4",
    name: "Global Events Ltd",
    slug: "global-events",
    plan: "enterprise",
    status: "suspended",
    memberCount: 28,
    projectCount: 15,
    owner: { name: "Emma Wilson", email: "emma@globalevents.com" },
    createdAt: "2022-11-05T09:00:00Z",
    lastActiveAt: "2023-12-20T14:00:00Z",
    monthlyRevenue: 999,
  },
  {
    id: "5",
    name: "Small Biz LLC",
    slug: "small-biz",
    plan: "pro",
    status: "archived",
    memberCount: 2,
    projectCount: 1,
    owner: { name: "Alex Brown", email: "alex@smallbiz.com" },
    createdAt: "2023-08-15T16:45:00Z",
    lastActiveAt: "2023-10-30T10:00:00Z",
    monthlyRevenue: 0,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function OrganizationsPage() {
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedRows, setSelectedRows] = useState<Organization[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      setOrganizations(mockOrganizations);
      setLoading(false);
    }, 800);
  }, []);

  const handleArchive = (org: Organization) => {
    toast({
      title: "Organization Archived",
      description: `${org.name} has been archived.`,
    });
  };

  const handleTransfer = (org: Organization) => {
    toast({
      title: "Transfer Ownership",
      description: `Initiated ownership transfer for ${org.name}.`,
    });
  };

  const handleDelete = (org: Organization) => {
    toast({
      title: "Organization Deleted",
      description: `${org.name} has been permanently deleted.`,
      variant: "destructive",
    });
  };

  const handleBulkArchive = () => {
    toast({
      title: "Organizations Archived",
      description: `${selectedRows.length} organizations archived.`,
    });
    setSelectedRows([]);
  };

  const handleBulkDelete = () => {
    toast({
      title: "Organizations Deleted",
      description: `${selectedRows.length} organizations deleted.`,
      variant: "destructive",
    });
    setSelectedRows([]);
  };

  const getPlanBadge = (plan: Organization["plan"]) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      free: "secondary",
      pro: "default",
      enterprise: "destructive",
    };
    return (
      <Badge variant={variants[plan]} className="capitalize">
        {plan}
      </Badge>
    );
  };

  const columns: AdminColumn<Organization>[] = [
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
      key: "monthlyRevenue",
      header: "MRR",
      accessor: (org) => `$${org.monthlyRevenue.toLocaleString()}`,
      sortable: true,
      align: "right",
    },
    {
      key: "owner",
      header: "Owner",
      accessor: (org) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {org.owner.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{org.owner.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "createdAt",
      header: "Created",
      accessor: (org) => new Date(org.createdAt).toLocaleDateString(),
      sortable: true,
      filterable: true,
      filterType: "date",
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

      <motion.div variants={itemVariants}>
        <Card>
          <AdminDataTable
            data={organizations}
            columns={columns}
            keyExtractor={(org) => org.id}
            loading={loading}
            searchable
            searchKeys={["name", "slug", "owner.name", "owner.email"]}
            sortable
            pagination
            pageSize={10}
            selectable
            onSelectionChange={setSelectedRows}
            onRowClick={(org) => setSelectedOrg(org)}
            title={`All Organizations (${organizations.length})`}
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
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
                        <span className="font-mono">{selectedOrg.id}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Created</span>
                        <span>{new Date(selectedOrg.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Last Active</span>
                        <span>{new Date(selectedOrg.lastActiveAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Owner</span>
                        <span>{selectedOrg.owner.name} ({selectedOrg.owner.email})</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="members" className="mt-4">
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Manage organization members in the members tab.</p>
                    <Button className="mt-4" variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      View All Members
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="billing" className="mt-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Plan</p>
                          <p className="text-lg font-semibold capitalize">{selectedOrg.plan}</p>
                        </div>
                        <Button variant="outline" size="sm">Change Plan</Button>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
                      <p className="text-2xl font-semibold">
                        ${selectedOrg.monthlyRevenue.toLocaleString()}
                      </p>
                    </div>
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
