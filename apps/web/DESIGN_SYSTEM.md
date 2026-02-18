# EIOS Enterprise Design System

A sophisticated, enterprise-grade design system inspired by Linear, Vercel, Notion, and Figma.

## 🎨 Philosophy

- **Warm & Inviting**: Cream base tones instead of stark whites
- **Sophisticated**: Deep charcoal for text, warm rose for accents
- **Accessible**: WCAG 2.1 AA compliant color contrast
- **Premium Feel**: Smooth animations and thoughtful micro-interactions

---

## 📦 Components

### Advanced UI Components (`components/ui/`)

#### `data-table.tsx`
Enterprise-grade data table with:
- Sorting (click column headers)
- Filtering (search across fields)
- Pagination (configurable page sizes)
- Row selection (checkboxes with bulk actions)
- Export functionality
- Loading skeleton state

```tsx
import { DataTable, Column } from "@/components/ui/data-table";

const columns: Column<Data>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name, sortable: true },
];

<DataTable
  data={data}
  columns={columns}
  keyExtractor={(row) => row.id}
  searchable
  pagination
  selectable
/>
```

#### `date-range-picker.tsx`
Professional date range selection with:
- Quick select presets (Today, Last 7 days, This month, etc.)
- Calendar picker
- Clear button
- Single date picker variant

```tsx
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";

const [range, setRange] = useState<DateRange>();

<DateRangePicker
  value={range}
  onChange={setRange}
  presets
/>
```

#### `command-palette.tsx`
Enhanced command palette with:
- Keyboard shortcut (⌘K)
- Search across commands
- Grouped sections
- Keyboard navigation
- Breadcrumb support

```tsx
import { CommandPalette } from "@/components/ui/command-palette";

<CommandPalette
  commands={[
    {
      id: "go-home",
      title: "Go to Dashboard",
      shortcut: "G D",
      action: () => router.push("/dashboard"),
      section: "Navigation",
    },
  ]}
/>
```

#### `metric-card.tsx`
Sophisticated metric cards with:
- Sparkline charts
- Trend indicators
- Comparison to previous periods
- Loading states

```tsx
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";

<MetricGrid columns={4}>
  <MetricCard
    title="Total Revenue"
    value="$48,290"
    change={12.5}
    trend="up"
    sparklineData={[30, 45, 35, 50, 48, 60, 55]}
  />
</MetricGrid>
```

#### `chart-container.tsx`
Reusable chart wrapper with:
- Loading states
- Error handling with retry
- Export functionality
- Header actions

```tsx
import { ChartContainer, ChartLegend } from "@/components/ui/chart-container";

<ChartContainer
  title="Revenue Overview"
  loading={isLoading}
  error={error}
  onRetry={refetch}
  onExport={exportChart}
>
  {/* Your chart component */}
</ChartContainer>
```

#### `timeline.tsx`
Visual timeline component for:
- Activity feeds
- Audit logs
- Step progress

```tsx
import { Timeline } from "@/components/ui/timeline";

<Timeline
  items={[
    {
      id: "1",
      title: "Project created",
      timestamp: new Date(),
      status: "completed",
      actor: { name: "John Doe", avatar: "/avatar.jpg" },
    },
  ]}
/>
```

#### `stat-trend.tsx`
Trend indicator with percentage visualization:

```tsx
import { StatTrend, StatComparison } from "@/components/ui/stat-trend";

<StatTrend value={12.5} direction="up" label="vs last month" />
<StatComparison current={100} previous={85} format="percentage" />
```

#### `avatar-group.tsx`
Stacked avatars for showing multiple users:

```tsx
import { AvatarGroup } from "@/components/ui/avatar-group";

<AvatarGroup
  users={[
    { id: "1", name: "John Doe", avatar: "/avatar1.jpg" },
    { id: "2", name: "Jane Smith", avatar: "/avatar2.jpg" },
  ]}
  max={5}
  size="default"
/>
```

#### `progress-steps.tsx`
Step indicator for multi-step processes:

```tsx
import { ProgressSteps, WizardControls } from "@/components/ui/progress-steps";

<ProgressSteps
  steps={[
    { id: "1", label: "Details", description: "Basic information" },
    { id: "2", label: "Settings", description: "Configure options" },
    { id: "3", label: "Review", description: "Final check" },
  ]}
  currentStep={currentStep}
/>
```

#### `empty-state.tsx`
Illustrated empty states with actions:

```tsx
import { EmptyState, EmptySearch } from "@/components/ui/empty-state";

<EmptyState
  variant="search"
  title="No results found"
  description="Try adjusting your search"
  primaryAction={{ label: "Clear filters", onClick: clearFilters }}
/>
```

#### `loading-skeleton.tsx`
Advanced skeleton loaders:

```tsx
import {
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  LoadingOverlay,
} from "@/components/ui/loading-skeleton";

<SkeletonCard header content footer />
<SkeletonTable rows={5} columns={4} />
```

---

### Layout Components (`components/layout/`)

#### `page-header.tsx`
Consistent page headers with breadcrumbs:

```tsx
import { PageHeader } from "@/components/layout/page-header";

<PageHeader
  title="Dashboard"
  description="Welcome back! Here's what's happening."
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Dashboard" },
  ]}
  actions={<Button>Create New</Button>}
/>
```

#### `section.tsx`
Section wrapper with consistent spacing:

```tsx
import { Section, SectionHeader } from "@/components/layout/section";

<Section spacing="lg" container>
  <SectionHeader
    title="Recent Projects"
    description="Your latest work"
    actions={<Button variant="outline">View all</Button>}
  />
  {/* Content */}
</Section>
```

#### `grid.tsx`
Advanced grid layouts:

```tsx
import { Grid, GridItem, AutoGrid, Stack } from "@/components/layout/grid";

<Grid cols={{ sm: 1, md: 2, lg: 4 }} gap="lg">
  <GridItem>Content</GridItem>
</Grid>

<AutoGrid minItemWidth="250px">
  {/* Responsive auto-fill grid */}
</AutoGrid>
```

#### `split-pane.tsx`
Resizable split panes:

```tsx
import { SplitPane } from "@/components/layout/split-pane";

<SplitPane
  left={<Sidebar />}
  right={<MainContent />}
  defaultSplit={30}
  storageKey="sidebar-width"
/>
```

---

## 🎨 Theme System (`lib/theme.ts`)

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `cream.50` | `#FDFCF8` | Page background |
| `cream.100` | `#FAF9F4` | Card backgrounds |
| `charcoal.900` | `#2A2A2A` | Primary text |
| `rose.500` | `#D94666` | Primary accent |
| `sage.600` | `#3D5F3D` | Success states |
| `coral.600` | `#C44A3B` | Error states |

### Typography

- **Sans**: Inter (UI, body text)
- **Serif**: Playfair Display (headings, special)
- **Scale**: Major Third (1.25) ratio

### Spacing (4px grid)

```
1  = 4px   (0.25rem)
2  = 8px   (0.5rem)
4  = 16px  (1rem)
6  = 24px  (1.5rem)
8  = 32px  (2rem)
12 = 48px  (3rem)
```

### Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Buttons, inputs |
| `shadow-md` | Cards, dropdowns |
| `shadow-lg` | Modals, popovers |
| `shadow-xl` | Full-screen overlays |

---

## ✨ Animation Utilities (`lib/animations.ts`)

### Page Transitions

```tsx
import { pageTransitions } from "@/lib/animations";

<motion.div variants={pageTransitions.premium}>
  {/* Page content */}
</motion.div>
```

### List Animations

```tsx
import { listItemVariants, staggerContainer } from "@/lib/animations";

<motion.div variants={staggerContainer(0.05)}>
  {items.map((item, i) => (
    <motion.div key={item.id} variants={listItemVariants} custom={i}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Easing Functions

```ts
const easings = {
  smooth: [0.4, 0, 0.2, 1],       // Standard transitions
  spring: [0.34, 1.56, 0.64, 1],  // Bouncy effects
  premium: [0.23, 1, 0.32, 1],    // Expo out (Linear-like)
};
```

### Durations

```ts
const durations = {
  fast: 0.1,     // Micro-interactions
  normal: 0.2,   // Standard
  medium: 0.3,   // Page transitions
  slow: 0.5,     // Complex animations
};
```

---

## 🧩 Usage Examples

### Complete Dashboard Page

```tsx
import { PageHeader } from "@/components/layout/page-header";
import { Section } from "@/components/layout/section";
import { Grid } from "@/components/layout/grid";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable } from "@/components/ui/data-table";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your events"
        actions={<Button>Create Event</Button>}
      />
      
      <Section>
        <Grid cols={4} gap="lg">
          <MetricCard
            title="Total Events"
            value="24"
            change={12}
            trend="up"
          />
          {/* More cards... */}
        </Grid>
      </Section>
      
      <Section>
        <DataTable
          data={events}
          columns={columns}
          keyExtractor={(e) => e.id}
        />
      </Section>
    </>
  );
}
```

---

## 📋 Dependencies to Add

Add these to your `package.json`:

```json
{
  "dependencies": {
    "react-day-picker": "^8.10.0"
  }
}
```

Then run:
```bash
npm install
```

---

## 🎯 Design Decisions

1. **Warm Cream Base**: Creates a welcoming, less sterile feel than pure white
2. **Rose Accent**: Sophisticated, warm alternative to standard blue
3. **4px Grid**: Consistent, harmonious spacing
4. **Premium Easing**: `cubic-bezier(0.23, 1, 0.32, 1)` for that Linear feel
5. **Framer Motion**: Hardware-accelerated, smooth animations

---

## 🔗 References

- [Linear Design](https://linear.app)
- [Vercel Design](https://vercel.com/design)
- [Notion Interface](https://notion.so)
- [Figma UI](https://figma.com)
