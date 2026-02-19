# Frontend Agent C: Business Dashboard Data Integration
**Task ID:** FRONTEND-2.3  
**Priority:** Critical  
**Estimated Time:** 6-7 hours

## Objective
Replace mock data in business dashboard with real APIs and implement all CRUD operations.

## Target File
`apps/web/app/dashboard/business/page.tsx`

## Current Issues

### Issue 1: Hardcoded Mock Data (Lines 36-61)
```typescript
const clients = [...]; // Fake clients
const teamMembers = [...]; // Fake team
const recentInvoices = [...]; // Fake invoices
const analytics = {...}; // Fake stats
```

### Issue 2: Non-Functional Buttons (9 buttons)
1. "New Event" - no handler
2. "Manage" (events) - no navigation
3. "More" menu - no dropdown
4. "Filter" - no functionality
5. "Add Client" - no modal
6. Chevron navigation - no links
7. "Invite Member" - no modal
8. "Message" team - no chat
9. "Create Invoice" - no form

## Implementation Steps

### Step 1: Create API Types and Methods

Add to `apps/web/lib/api.ts`:

```typescript
export interface BusinessDashboardData {
  clients: Client[];
  events: Event[];
  teamMembers: TeamMember[];
  invoices: Invoice[];
  analytics: {
    totalRevenue: number;
    activeEvents: number;
    totalGuests: number;
    conversionRate: number;
  };
}

export interface Client {
  id: string;
  name: string;
  type: string;
  date: string;
  status: 'active' | 'planning' | 'completed';
  guests: number;
  revenue: number;
}

export const businessApi = {
  getDashboard: () => api.get<BusinessDashboardData>("/dashboard/business"),
  createEvent: (data: { name: string; type: string; date: string; clientId?: string }) =>
    api.post("/events", data),
  createClient: (data: { name: string; type: string; email: string }) =>
    api.post("/clients", data),
  inviteTeamMember: (data: { email: string; role: string }) =>
    api.post("/team/invite", data),
  createInvoice: (data: { clientId: string; amount: number; dueDate: string }) =>
    api.post("/invoices", data),
};
```

### Step 2: Create React Query Hooks

Create `apps/web/hooks/useBusinessDashboard.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessApi } from "@/lib/api";
import { showToast } from "@/components/ui/toaster";

export function useBusinessDashboard() {
  return useQuery({
    queryKey: ["business-dashboard"],
    queryFn: () => businessApi.getDashboard().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: businessApi.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Event created", variant: "success" });
    },
    onError: () => {
      showToast({ title: "Failed to create event", variant: "destructive" });
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: businessApi.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Client added", variant: "success" });
    },
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: businessApi.inviteTeamMember,
    onSuccess: () => {
      showToast({ 
        title: "Invitation sent", 
        description: "They'll receive an email shortly.",
        variant: "success" 
      });
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: businessApi.createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      showToast({ title: "Invoice created", variant: "success" });
    },
  });
}
```

### Step 3: Implement Modal Components

Create these modal components:

**NewEventModal:**
```typescript
function NewEventModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Wedding");
  const [date, setDate] = useState("");
  const createEvent = useCreateEvent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createEvent.mutateAsync({ name, type, date });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Event Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Event Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectItem value="Wedding">Wedding</SelectItem>
              <SelectItem value="Birthday">Birthday</SelectItem>
              <SelectItem value="Corporate">Corporate</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </Select>
          </div>
          <div>
            <Label>Event Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

Similar modals needed for:
- `InviteMemberModal` - Email + role selection
- `CreateInvoiceModal` - Client select, amount, due date
- `AddClientModal` - Name, type, email

### Step 4: Replace Mock Data

```typescript
export default function BusinessDashboard() {
  const { data, isLoading, error } = useBusinessDashboard();
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [activeTab, setActiveTab] = useState("events");

  if (isLoading) return <BusinessDashboardSkeleton />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!data) return <EmptyState />;

  const { clients, events, teamMembers, invoices, analytics } = data;

  return (
    // JSX using real data
  );
}
```

### Step 5: Fix All Button Handlers

**New Event Button:**
```typescript
<Button onClick={() => setShowNewEvent(true)}>
  <Plus className="w-4 h-4 mr-2" />
  New Event
</Button>
```

**Manage Event Link:**
```typescript
<Link href={`/events/${client.id}`}>
  <Button variant="outline" size="sm">Manage</Button>
</Link>
```

**Filter & Add Client:**
```typescript
const [filter, setFilter] = useState("");
const [showAddClient, setShowAddClient] = useState(false);

// Filter clients:
const filteredClients = clients.filter(c => 
  c.name.toLowerCase().includes(filter.toLowerCase()) ||
  c.type.toLowerCase().includes(filter.toLowerCase())
);
```

**Invite Member:**
```typescript
<Button onClick={() => setShowInviteMember(true)}>
  <Plus className="w-4 h-4 mr-2" />
  Invite Member
</Button>
```

**Create Invoice:**
```typescript
<Button onClick={() => setShowCreateInvoice(true)}>
  <Plus className="w-4 h-4 mr-2" />
  Create Invoice
</Button>
```

### Step 6: Add Loading Skeleton

```typescript
function BusinessDashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Welcome banner */}
      <div className="h-32 bg-gray-200 animate-pulse rounded-2xl" />
      
      {/* Analytics cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
      
      {/* Tabs */}
      <div className="h-10 bg-gray-200 animate-pulse rounded w-64" />
      
      {/* Table content */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    </div>
  );
}
```

### Step 7: Add Client/Invoice Dropdown Actions

Use DropdownMenu for "More" button:

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="w-4 h-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => router.push(`/events/${event.id}/edit`)}>
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => duplicateEvent(event.id)}>
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuItem 
      className="text-red-600"
      onClick={() => archiveEvent(event.id)}
    >
      Archive
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Testing Checklist

- [ ] Dashboard loads with real data
- [ ] "New Event" opens modal and creates event
- [ ] "Invite Member" sends invitation
- [ ] "Create Invoice" creates invoice
- [ ] "Add Client" adds to client list
- [ ] Filter functionality works
- [ ] Event cards show real data
- [ ] Team members display correctly
- [ ] Invoices show with correct status badges
- [ ] Analytics numbers are real
- [ ] All loading states work
- [ ] Error states handled gracefully

## Dependencies

- Backend Agent B must complete `BACKEND-1.2`
- Need Dialog, DropdownMenu, Select components from shadcn
- Verify API endpoints match backend spec
