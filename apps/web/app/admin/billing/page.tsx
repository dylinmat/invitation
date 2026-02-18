"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCard, StatsGrid } from "@/components/admin/stats-card";
import { AdminDataTable, AdminColumn } from "@/components/admin/data-table";
import { PaymentStatusBadge, SubscriptionStatusBadge } from "@/components/admin/status-badge";
import { ActionMenu, createBillingActions } from "@/components/admin/action-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { useAdminOrganizations, useAdminRevenue } from "@/hooks/useAdmin";
import type { AdminOrganization } from "@/lib/admin-api";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Download,
  Plus,
  Users,
  Calendar,
  Tag,
} from "lucide-react";

// Types
interface Invoice {
  id: string;
  customer: {
    name: string;
    email: string;
    organization: string;
  };
  amount: number;
  status: "paid" | "unpaid" | "overdue" | "refunded" | "failed";
  date: string;
  dueDate: string;
  plan: string;
}

interface Subscription {
  id: string;
  customer: string;
  plan: string;
  status: "active" | "trialing" | "past_due" | "cancelled" | "paused";
  mrr: number;
  startDate: string;
  nextBillingDate: string;
}

interface Coupon {
  id: string;
  code: string;
  discount: string;
  type: "percentage" | "fixed";
  value: number;
  usageCount: number;
  usageLimit: number;
  expiresAt: string;
  isActive: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Mock data for invoices (would come from payment provider in real implementation)
const mockInvoices: Invoice[] = [
  {
    id: "inv_1",
    customer: { name: "John Smith", email: "john@acme.com", organization: "Acme Corp" },
    amount: 999,
    status: "paid",
    date: "2024-01-15",
    dueDate: "2024-01-15",
    plan: "Enterprise",
  },
  {
    id: "inv_2",
    customer: { name: "Sarah Johnson", email: "sarah@techstart.io", organization: "TechStart" },
    amount: 199,
    status: "paid",
    date: "2024-01-14",
    dueDate: "2024-01-14",
    plan: "Pro",
  },
  {
    id: "inv_3",
    customer: { name: "Mike Chen", email: "mike@design.co", organization: "Design Studio" },
    amount: 199,
    status: "overdue",
    date: "2024-01-01",
    dueDate: "2024-01-01",
    plan: "Pro",
  },
  {
    id: "inv_4",
    customer: { name: "Emma Wilson", email: "emma@startup.com", organization: "Startup Inc" },
    amount: 999,
    status: "failed",
    date: "2024-01-13",
    dueDate: "2024-01-13",
    plan: "Enterprise",
  },
];

const mockCoupons: Coupon[] = [
  { id: "c1", code: "WELCOME20", discount: "20% off", type: "percentage", value: 20, usageCount: 145, usageLimit: 500, expiresAt: "2024-12-31", isActive: true },
  { id: "c2", code: "EARLYBIRD", discount: "$50 off", type: "fixed", value: 50, usageCount: 89, usageLimit: 100, expiresAt: "2024-03-01", isActive: true },
  { id: "c3", code: "BLACKFRIDAY", discount: "50% off", type: "percentage", value: 50, usageCount: 0, usageLimit: 1000, expiresAt: "2024-11-30", isActive: false },
];

export default function BillingPage() {
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch real revenue metrics
  const { data: revenueData, isLoading: isRevenueLoading } = useAdminRevenue();
  
  // Fetch organizations for subscription data
  const { data: orgsData, isLoading: isOrgsLoading } = useAdminOrganizations({
    page,
    limit: pageSize,
  });

  const metrics = revenueData;
  const organizations = orgsData?.organizations || [];

  // Transform organizations to subscriptions format
  const subscriptions: Subscription[] = organizations
    .filter(org => org.plan !== 'free')
    .map(org => ({
      id: `sub_${org.id}`,
      customer: org.name,
      plan: org.plan,
      status: org.status === 'active' ? 'active' : 'paused',
      mrr: org.plan === 'enterprise' ? 999 : 199,
      startDate: org.createdAt,
      nextBillingDate: new Date(new Date(org.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));

  const handleRefund = (invoice: Invoice) => {
    toast({
      title: "Refund Processed",
      description: `$${invoice.amount} refunded to ${invoice.customer.name}`,
    });
  };

  const handleCancelSubscription = (sub: Subscription) => {
    toast({
      title: "Subscription Cancelled",
      description: `${sub.customer}'s subscription has been cancelled.`,
    });
  };

  const invoiceColumns: AdminColumn<Invoice>[] = [
    {
      key: "customer",
      header: "Customer",
      accessor: (inv) => (
        <div>
          <p className="font-medium text-sm">{inv.customer.name}</p>
          <p className="text-xs text-muted-foreground">{inv.customer.organization}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: "amount",
      header: "Amount",
      accessor: (inv) => `$${inv.amount.toLocaleString()}`,
      sortable: true,
      align: "right",
    },
    {
      key: "status",
      header: "Status",
      accessor: (inv) => <PaymentStatusBadge status={inv.status} />,
      sortable: true,
    },
    {
      key: "plan",
      header: "Plan",
      accessor: (inv) => <Badge variant="outline">{inv.plan}</Badge>,
      sortable: true,
    },
    {
      key: "date",
      header: "Date",
      accessor: (inv) => new Date(inv.date).toLocaleDateString(),
      sortable: true,
    },
    {
      key: "actions",
      header: "",
      accessor: (inv) => (
        <ActionMenu
          actions={createBillingActions({
            onViewInvoice: () => setSelectedInvoice(inv),
            onRefund: () => handleRefund(inv),
          })}
        />
      ),
      align: "right",
    },
  ];

  const subscriptionColumns: AdminColumn<Subscription>[] = [
    {
      key: "customer",
      header: "Customer",
      accessor: (sub) => sub.customer,
      sortable: true,
    },
    {
      key: "plan",
      header: "Plan",
      accessor: (sub) => <Badge variant="outline" className="capitalize">{sub.plan}</Badge>,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (sub) => <SubscriptionStatusBadge status={sub.status} />,
      sortable: true,
    },
    {
      key: "mrr",
      header: "MRR",
      accessor: (sub) => `$${sub.mrr}`,
      sortable: true,
      align: "right",
    },
    {
      key: "nextBillingDate",
      header: "Next Billing",
      accessor: (sub) => sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : "-",
      sortable: true,
    },
    {
      key: "actions",
      header: "",
      accessor: (sub) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCancelSubscription(sub)}
          disabled={sub.status === "cancelled"}
        >
          Cancel
        </Button>
      ),
      align: "right",
    },
  ];

  const couponColumns: AdminColumn<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      accessor: (c) => (
        <code className="bg-muted px-2 py-1 rounded text-sm">{c.code}</code>
      ),
      sortable: true,
    },
    {
      key: "discount",
      header: "Discount",
      accessor: (c) => c.discount,
      sortable: true,
    },
    {
      key: "usage",
      header: "Usage",
      accessor: (c) => (
        <span className="text-sm">
          {c.usageCount} / {c.usageLimit}
        </span>
      ),
      sortable: true,
      align: "center",
    },
    {
      key: "status",
      header: "Status",
      accessor: (c) => (
        <Badge variant={c.isActive ? "default" : "secondary"}>
          {c.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "expiresAt",
      header: "Expires",
      accessor: (c) => new Date(c.expiresAt).toLocaleDateString(),
      sortable: true,
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
          title="Billing & Plans"
          description="Manage subscriptions, invoices, and revenue"
        />
      </motion.div>

      {/* Revenue Metrics */}
      <motion.div variants={itemVariants}>
        <StatsGrid columns={4}>
          <StatsCard
            title="Monthly Recurring Revenue"
            value={isRevenueLoading ? "..." : `$${metrics?.mrr.toLocaleString() || "0"}`}
            icon={DollarSign}
            trend={metrics ? { value: metrics.revenueGrowth, direction: "up", label: "vs last month" } : undefined}
            loading={isRevenueLoading}
          />
          <StatsCard
            title="Annual Recurring Revenue"
            value={isRevenueLoading ? "..." : `$${metrics?.arr.toLocaleString() || "0"}`}
            icon={TrendingUp}
            loading={isRevenueLoading}
          />
          <StatsCard
            title="Active Subscriptions"
            value={isRevenueLoading ? "..." : metrics?.activeSubscriptions.toLocaleString() || "0"}
            icon={Users}
            loading={isRevenueLoading}
          />
          <StatsCard
            title="Churn Rate"
            value={isRevenueLoading ? "..." : `${metrics?.churnRate || 0}%`}
            icon={TrendingDown}
            trend={metrics ? { value: -0.5, direction: "down", label: "vs last month" } : undefined}
            loading={isRevenueLoading}
          />
        </StatsGrid>
      </motion.div>

      {/* Plan Distribution */}
      {!isRevenueLoading && metrics?.planDistribution && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Plan Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {metrics.planDistribution.map((plan) => (
                  <div key={plan.code} className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                    <span className="font-medium capitalize">{plan.name}</span>
                    <Badge variant="secondary">{plan.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="subscriptions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2">
              <Tag className="h-4 w-4" />
              Coupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <Card>
              <AdminDataTable
                data={mockInvoices}
                columns={invoiceColumns}
                keyExtractor={(inv) => inv.id}
                loading={false}
                searchable
                sortable
                pagination
                title="Recent Invoices"
                exportFileName="invoices"
              />
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <AdminDataTable
                data={subscriptions}
                columns={subscriptionColumns}
                keyExtractor={(sub) => sub.id}
                loading={isOrgsLoading}
                searchable
                sortable
                pagination
                title={`Active Subscriptions (${subscriptions.length})`}
                exportFileName="subscriptions"
              />
            </Card>
          </TabsContent>

          <TabsContent value="coupons">
            <Card>
              <AdminDataTable
                data={mockCoupons}
                columns={couponColumns}
                keyExtractor={(c) => c.id}
                loading={false}
                searchable
                sortable
                pagination
                toolbar={
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Coupon
                  </Button>
                }
                title="Promo Codes"
                exportFileName="coupons"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Invoice Details Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent>
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle>Invoice Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold">${selectedInvoice.amount}</p>
                  </div>
                  <PaymentStatusBadge status={selectedInvoice.status} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice ID</span>
                    <span className="font-mono">{selectedInvoice.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span>{selectedInvoice.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organization</span>
                    <span>{selectedInvoice.customer.organization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span>{selectedInvoice.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  {selectedInvoice.status === "paid" && (
                    <Button variant="outline" onClick={() => handleRefund(selectedInvoice)}>
                      Refund
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
