import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from "date-fns";

// ============================================================================
// Types
// ============================================================================

export type DateRange = "7d" | "30d" | "90d" | "6m" | "1y" | "custom";

export interface DateRangeValue {
  from: Date;
  to: Date;
}

export interface RSVPData {
  date: Date;
  accepted: number;
  declined: number;
  pending: number;
}

export interface GuestDemographics {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface EventPerformance {
  id: string;
  name: string;
  sent: number;
  opened: number;
  clicked: number;
  rsvp: number;
  acceptanceRate: number;
}

export interface FunnelStage {
  name: string;
  value: number;
  percentage: number;
  dropOff: number;
  color: string;
}

export interface HeatmapData {
  day: number;
  hour: number;
  value: number;
}

export interface RealTimeStat {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  unit?: string;
  trend: "up" | "down" | "neutral";
  change: number;
}

export interface TrendData {
  direction: "up" | "down" | "stable";
  percentage: number;
  label: string;
}

// ============================================================================
// Date Range Utilities
// ============================================================================

export function getDateRangeFromPreset(preset: DateRange): DateRangeValue {
  const now = new Date();
  
  switch (preset) {
    case "7d":
      return { from: subDays(now, 7), to: now };
    case "30d":
      return { from: subDays(now, 30), to: now };
    case "90d":
      return { from: subDays(now, 90), to: now };
    case "6m":
      return { from: subMonths(now, 6), to: now };
    case "1y":
      return { from: subMonths(now, 12), to: now };
    default:
      return { from: subDays(now, 30), to: now };
  }
}

export function getPreviousPeriod(dateRange: DateRangeValue): DateRangeValue {
  const duration = dateRange.to.getTime() - dateRange.from.getTime();
  return {
    from: new Date(dateRange.from.getTime() - duration),
    to: new Date(dateRange.from.getTime()),
  };
}

export function formatDateRangeLabel(range: DateRangeValue): string {
  const sameMonth = range.from.getMonth() === range.to.getMonth() &&
    range.from.getFullYear() === range.to.getFullYear();
  
  if (sameMonth) {
    return `${format(range.from, "MMM d")} - ${format(range.to, "d, yyyy")}`;
  }
  
  const sameYear = range.from.getFullYear() === range.to.getFullYear();
  if (sameYear) {
    return `${format(range.from, "MMM d")} - ${format(range.to, "MMM d, yyyy")}`;
  }
  
  return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
}

// ============================================================================
// Data Grouping Utilities
// ============================================================================

export function groupByDay<T extends { date: Date }>(
  data: T[],
  dateRange: DateRangeValue
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  // Initialize all days in range with empty arrays
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  days.forEach(day => {
    grouped.set(format(day, "yyyy-MM-dd"), []);
  });
  
  // Group data
  data.forEach(item => {
    const key = format(item.date, "yyyy-MM-dd");
    if (grouped.has(key)) {
      grouped.get(key)!.push(item);
    }
  });
  
  return grouped;
}

export function groupByWeek<T extends { date: Date }>(
  data: T[],
  dateRange: DateRangeValue
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  // Initialize all weeks in range
  const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });
  weeks.forEach(week => {
    grouped.set(format(week, "yyyy-'W'ww"), []);
  });
  
  // Group data
  data.forEach(item => {
    const key = format(item.date, "yyyy-'W'ww");
    if (grouped.has(key)) {
      grouped.get(key)!.push(item);
    }
  });
  
  return grouped;
}

export function groupByMonth<T extends { date: Date }>(
  data: T[],
  dateRange: DateRangeValue
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  // Initialize all months in range
  const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
  months.forEach(month => {
    grouped.set(format(month, "yyyy-MM"), []);
  });
  
  // Group data
  data.forEach(item => {
    const key = format(item.date, "yyyy-MM");
    if (grouped.has(key)) {
      grouped.get(key)!.push(item);
    }
  });
  
  return grouped;
}

// ============================================================================
// RSVP Data Transformation
// ============================================================================

export interface RawRSVP {
  id: string;
  date: Date;
  status: "accepted" | "declined" | "pending";
  guestType?: string;
}

export function transformRSVPTrends(
  data: RawRSVP[],
  dateRange: DateRangeValue,
  grouping: "day" | "week" | "month" = "day"
): RSVPData[] {
  const grouper = grouping === "week" ? groupByWeek : 
                  grouping === "month" ? groupByMonth : groupByDay;
  
  const grouped = grouper(data, dateRange);
  const result: RSVPData[] = [];
  
  grouped.forEach((items, key) => {
    const accepted = items.filter(i => i.status === "accepted").length;
    const declined = items.filter(i => i.status === "declined").length;
    const pending = items.filter(i => i.status === "pending").length;
    
    result.push({
      date: new Date(key),
      accepted,
      declined,
      pending,
    });
  });
  
  return result.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ============================================================================
// Guest Demographics Transformation
// ============================================================================

export const GUEST_TYPE_COLORS: Record<string, string> = {
  "Family": "#8B6B5D",
  "Friends": "#D4A574",
  "Colleagues": "#A8D8B9",
  "VIP": "#F4A261",
  "Plus One": "#E76F51",
  "Children": "#2A9D8F",
  "default": "#9CA3AF",
};

export function transformGuestDemographics(
  guests: Array<{ type: string; count: number }>
): GuestDemographics[] {
  const total = guests.reduce((sum, g) => sum + g.count, 0);
  
  return guests.map(guest => ({
    type: guest.type,
    count: guest.count,
    percentage: total > 0 ? Math.round((guest.count / total) * 1000) / 10 : 0,
    color: GUEST_TYPE_COLORS[guest.type] || GUEST_TYPE_COLORS.default,
  })).sort((a, b) => b.count - a.count);
}

// ============================================================================
// Event Performance Transformation
// ============================================================================

export function transformEventPerformance(
  events: Array<{
    id: string;
    name: string;
    invitationsSent: number;
    invitationsOpened: number;
    linksClicked: number;
    rsvps: number;
    accepted: number;
  }>
): EventPerformance[] {
  return events.map(event => ({
    id: event.id,
    name: event.name,
    sent: event.invitationsSent,
    opened: event.invitationsOpened,
    clicked: event.linksClicked,
    rsvp: event.rsvps,
    acceptanceRate: event.invitationsSent > 0 
      ? Math.round((event.accepted / event.invitationsSent) * 1000) / 10 
      : 0,
  })).sort((a, b) => b.rsvp - a.rsvp);
}

// ============================================================================
// Funnel Transformation
// ============================================================================

export function transformInvitationFunnel(
  data: {
    sent: number;
    opened: number;
    clicked: number;
    rsvpStarted: number;
    rsvpCompleted: number;
  }
): FunnelStage[] {
  const stages = [
    { name: "Sent", value: data.sent, color: "#8B6B5D" },
    { name: "Opened", value: data.opened, color: "#9CA3AF" },
    { name: "Clicked", value: data.clicked, color: "#D4A574" },
    { name: "RSVP Started", value: data.rsvpStarted, color: "#A8D8B9" },
    { name: "RSVP Completed", value: data.rsvpCompleted, color: "#2A9D8F" },
  ];
  
  return stages.map((stage, index) => {
    const percentage = data.sent > 0 ? Math.round((stage.value / data.sent) * 1000) / 10 : 0;
    const prevValue = index > 0 ? stages[index - 1].value : stage.value;
    const dropOff = prevValue > 0 ? Math.round(((prevValue - stage.value) / prevValue) * 1000) / 10 : 0;
    
    return {
      ...stage,
      percentage,
      dropOff: index > 0 ? dropOff : 0,
    };
  });
}

// ============================================================================
// Heatmap Transformation
// ============================================================================

export function transformEngagementHeatmap(
  events: Array<{ timestamp: Date; value: number }>,
  dateRange: DateRangeValue
): HeatmapData[] {
  const result: HeatmapData[] = [];
  
  // Initialize 7 days x 24 hours grid
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      result.push({ day, hour, value: 0 });
    }
  }
  
  // Aggregate events
  events.forEach(event => {
    if (isWithinInterval(event.timestamp, { start: dateRange.from, end: dateRange.to })) {
      const day = event.timestamp.getDay();
      const hour = event.timestamp.getHours();
      const index = day * 24 + hour;
      if (result[index]) {
        result[index].value += event.value;
      }
    }
  });
  
  return result;
}

export function getHeatmapColor(value: number, max: number): string {
  if (max === 0) return "#F3F4F6";
  
  const intensity = Math.min(value / max, 1);
  
  // Color scale from light beige to primary brown
  const colors = [
    { r: 243, g: 244, b: 246 }, // #F3F4F6
    { r: 232, g: 213, b: 208 }, // #E8D5D0
    { r: 212, g: 184, b: 175 }, // #D4B8AF
    { r: 176, g: 145, b: 133 }, // #B09185
    { r: 139, g: 107, b: 93 },  // #8B6B5D
  ];
  
  const index = Math.floor(intensity * (colors.length - 1));
  const color = colors[Math.min(index, colors.length - 1)];
  
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ============================================================================
// Percentage Calculations
// ============================================================================

export function calculatePercentage(value: number, total: number, decimals = 1): number {
  if (total === 0) return 0;
  const multiplier = Math.pow(10, decimals);
  return Math.round((value / total) * 100 * multiplier) / multiplier;
}

export function calculateChange(current: number, previous: number): TrendData {
  if (previous === 0) {
    return {
      direction: current > 0 ? "up" : "stable",
      percentage: current > 0 ? 100 : 0,
      label: current > 0 ? "+100%" : "No change",
    };
  }
  
  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change);
  
  return {
    direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
    percentage: Math.round(absChange * 10) / 10,
    label: `${change >= 0 ? "+" : ""}${Math.round(change * 10) / 10}%`,
  };
}

// ============================================================================
// Trend Detection
// ============================================================================

export interface TrendAnalysis {
  direction: "up" | "down" | "stable";
  strength: "strong" | "moderate" | "weak";
  slope: number;
  r2: number;
  forecast: number;
}

export function detectTrend(data: number[]): TrendAnalysis {
  if (data.length < 2) {
    return { direction: "stable", strength: "weak", slope: 0, r2: 0, forecast: data[0] || 0 };
  }
  
  // Simple linear regression
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * data[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = data.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
  const ssResidual = data.reduce((a, b, i) => a + Math.pow(b - (slope * i + intercept), 2), 0);
  const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;
  
  // Determine direction and strength
  const avgValue = sumY / n;
  const relativeSlope = avgValue > 0 ? Math.abs(slope / avgValue) : 0;
  
  let direction: "up" | "down" | "stable" = "stable";
  if (slope > 0.01) direction = "up";
  else if (slope < -0.01) direction = "down";
  
  let strength: "strong" | "moderate" | "weak" = "weak";
  if (relativeSlope > 0.1 || r2 > 0.7) strength = "strong";
  else if (relativeSlope > 0.05 || r2 > 0.4) strength = "moderate";
  
  // Forecast next value
  const forecast = slope * n + intercept;
  
  return {
    direction,
    strength,
    slope: Math.round(slope * 1000) / 1000,
    r2: Math.round(r2 * 100) / 100,
    forecast: Math.max(0, Math.round(forecast)),
  };
}

// ============================================================================
// Real-time Stats
// ============================================================================

export function generateRealTimeStats(
  current: Record<string, number>,
  previous: Record<string, number>
): RealTimeStat[] {
  const definitions: Array<{ id: string; label: string; unit?: string }> = [
    { id: "activeUsers", label: "Active Users" },
    { id: "pageViews", label: "Page Views" },
    { id: "invitationsSent", label: "Invitations Sent" },
    { id: "rsvps", label: "RSVPs" },
    { id: "conversionRate", label: "Conversion Rate", unit: "%" },
  ];
  
  return definitions.map(def => {
    const value = current[def.id] || 0;
    const prevValue = previous[def.id] || 0;
    const change = prevValue > 0 ? ((value - prevValue) / prevValue) * 100 : 0;
    
    let trend: "up" | "down" | "neutral" = "neutral";
    if (change > 0.1) trend = "up";
    else if (change < -0.1) trend = "down";
    
    return {
      id: def.id,
      label: def.label,
      value,
      previousValue: prevValue,
      unit: def.unit,
      trend,
      change: Math.round(change * 10) / 10,
    };
  });
}

// ============================================================================
// Export Utilities
// ============================================================================

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return "";
      if (value instanceof Date) return value.toISOString();
      if (typeof value === "string" && value.includes(",")) return `"${value}"`;
      return String(value);
    }).join(",")
  );
  
  const csv = [headers.join(","), ...rows].join("\n");
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Mock Data Generators (for development/testing)
// ============================================================================

export function generateMockRSVPData(dateRange: DateRangeValue): RawRSVP[] {
  const data: RawRSVP[] = [];
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  
  const guestTypes = ["Family", "Friends", "Colleagues", "VIP", "Plus One"];
  
  days.forEach(day => {
    // Random number of RSVPs per day (0-10)
    const count = Math.floor(Math.random() * 10);
    
    for (let i = 0; i < count; i++) {
      const statuses: ("accepted" | "declined" | "pending")[] = ["accepted", "declined", "pending"];
      const weights = [0.6, 0.2, 0.2]; // 60% accepted, 20% declined, 20% pending
      
      let random = Math.random();
      let statusIndex = 0;
      for (let j = 0; j < weights.length; j++) {
        random -= weights[j];
        if (random <= 0) {
          statusIndex = j;
          break;
        }
      }
      
      data.push({
        id: `rsvp-${data.length}`,
        date: day,
        status: statuses[statusIndex],
        guestType: guestTypes[Math.floor(Math.random() * guestTypes.length)],
      });
    }
  });
  
  return data;
}

export function generateMockGuestDemographics(): Array<{ type: string; count: number }> {
  return [
    { type: "Family", count: 45 },
    { type: "Friends", count: 32 },
    { type: "Colleagues", count: 18 },
    { type: "VIP", count: 8 },
    { type: "Plus One", count: 12 },
    { type: "Children", count: 5 },
  ];
}

export function generateMockEventPerformance(): Array<{
  id: string;
  name: string;
  invitationsSent: number;
  invitationsOpened: number;
  linksClicked: number;
  rsvps: number;
  accepted: number;
}> {
  const events = [
    "Sarah & John's Wedding",
    "Corporate Gala 2024",
    "Birthday Celebration",
    "Product Launch",
    "Annual Dinner",
    "Graduation Party",
  ];
  
  return events.map((name, index) => {
    const sent = 50 + Math.floor(Math.random() * 150);
    const opened = Math.floor(sent * (0.5 + Math.random() * 0.4));
    const clicked = Math.floor(opened * (0.4 + Math.random() * 0.4));
    const rsvps = Math.floor(clicked * (0.6 + Math.random() * 0.3));
    const accepted = Math.floor(rsvps * (0.7 + Math.random() * 0.25));
    
    return {
      id: `event-${index}`,
      name,
      invitationsSent: sent,
      invitationsOpened: opened,
      linksClicked: clicked,
      rsvps,
      accepted,
    };
  });
}

export function generateMockFunnelData() {
  const sent = 1000;
  const opened = Math.floor(sent * 0.65);
  const clicked = Math.floor(opened * 0.55);
  const rsvpStarted = Math.floor(clicked * 0.70);
  const rsvpCompleted = Math.floor(rsvpStarted * 0.85);
  
  return {
    sent,
    opened,
    clicked,
    rsvpStarted,
    rsvpCompleted,
  };
}

export function generateMockHeatmapData(dateRange: DateRangeValue): Array<{ timestamp: Date; value: number }> {
  const events: Array<{ timestamp: Date; value: number }> = [];
  const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
  
  days.forEach(day => {
    // Simulate engagement patterns (higher during evenings and weekends)
    for (let hour = 0; hour < 24; hour++) {
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isEvening = hour >= 18 && hour <= 22;
      const isWorkHours = hour >= 9 && hour <= 17;
      
      let baseValue = Math.random() * 2;
      if (isEvening) baseValue += 3;
      if (isWeekend) baseValue += 2;
      if (isWorkHours && !isWeekend) baseValue += 1;
      
      const count = Math.floor(baseValue);
      for (let i = 0; i < count; i++) {
        const timestamp = new Date(day);
        timestamp.setHours(hour, Math.floor(Math.random() * 60));
        events.push({ timestamp, value: 1 });
      }
    }
  });
  
  return events;
}
