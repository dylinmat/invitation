"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Section, SectionHeader } from "@/components/layout/section";
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
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Download,
  Plus,
  ArrowUpRight,
  Users,
  Calendar,
  Receipt,
  Tag,
  MoreHorizontal,
} from "lucide-react";

// Types
interface RevenueMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  revenueGrowth: number;
  activeSubscriptions: number;
  churnRate: number;
  arpu: number;
  ltv: number;
}

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

// Mock data
const mockMetrics: RevenueMetrics = {
  mrr: 48500,
  arr: 582000,
  totalRevenue: 1250000,
  revenueGrowth: 23.5,
  activeSubscriptions: 892,
  churnRate: 2.3,
  arpu: 54.32,
  ltv: 1800,
};

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

const mockSubscriptions: Subscription[] = [
  { id: "sub_1", customer: "Acme Corp", plan: "Enterprise", status: "active", mrr: 999, startDate: "2023-01-15", nextBillingDate: "2024-02-15" },
  { id: "sub_2", customer: "TechStart Inc", plan: "Pro", status: "active", mrr: 199, startDate: "2023-03-20", nextBillingDate: "2024-02-20" },
  { id: "sub_3", customer: "Design Co", plan: "Pro", status: "past_due", mrr: 199, startDate: "2023-06-10", nextBillingDate: "2024-01-10" },
  { id: "sub_4", customer: "Small Biz LLC", plan: "Free", status: "cancelled", mrr: 0, startDate: "2023-08-15", nextBillingDate: "" },
];

const mockCoupons: Coupon[] = [
  { id: "c1", code: "WELCOME20", discount: "20% off", type: "percentage", value: 20, usageCount: 145, usageLimit: 500, expiresAt: "2024-12-31", isActive: true },
  { id: "c2", code: "EARLYBIRD", discount: "$50 off", type: "fixed", value: 50, usageCount: 89, usageLimit: 100, expiresAt: "2024-03-01", isActive: true },
  { id: "c3", code: "BLACKFRIDAY", discount: "50% off", type: "percentage", value: 50, usageCount: 0, usageLimit: 1000, expiresAt: "2024-11-30", isActive: false },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setTimeout(() => {
      setMetrics(mockMetrics);
      setInvoices(mockInvoices);
      setSubscriptions(mockSubscriptions);
      setCoupons(mockCoupons);
      setLoading(false);
    }, 800);
  }, []);

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
      accessor: (sub) => <Badge variant="outline">{sub.plan}</Badge>,
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
            value={loading ? "..." : `$${metrics?.mrr.toLocaleString()}`}
            icon={DollarSign}
            trend={metrics ? { value: metrics.revenueGrowth, direction: "up", label: "vs last month" } : undefined}
            loading={loading}
          />
          <StatsCard
            title="Annual Recurring Revenue"
            value={loading ? "..." : `$${metrics?.arr.toLocaleString()}`}
            icon={TrendingUp}
            loading={loading}
          />
          <StatsCard
            title="Active Subscriptions"
            value={loading ? "..." : metrics?.activeSubscriptions.toLocaleString()}
            icon={Users}
            loading={loading}
          />
          <StatsCard
            title="Churn Rate"
            value={loading ? "..." : `${metrics?.churnRate}%`}
            icon={TrendingDown}
            trend={metrics ? { value: -0.5, direction: "down", label: "vs last month" } : undefined}
            loading={loading}
          />
        </StatsGrid>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="invoices" className="space-y-6">
          <TabsList>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="h-4 w-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2">
              <Tag className="h-4 w-4" />
              Coupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <Card>
              <AdminDataTable
                data={invoices}
                columns={invoiceColumns}
                keyExtractor={(inv) => inv.id}
                loading={loading}
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
                loading={loading}
                searchable
                sortable
                pagination
                title="Active Subscriptions"
                exportFileName="subscriptions"
              />
            </Card>
          </TabsContent>

          <TabsContent value="coupons">
            <Card>
              <AdminDataTable
                data={coupons}
                columns={couponColumns}
                keyExtractor={(c) => c.id}
                loading={loading}
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
