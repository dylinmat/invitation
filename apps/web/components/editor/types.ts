export interface SiteTheme {
  primaryColor: string;
  secondaryColor: string;
  fontHeading: string;
  fontBody: string;
}

export interface SiteSettings {
  title: string;
  description: string;
  favicon?: string;
}

export type SectionType =
  | "hero"
  | "story"
  | "timeline"
  | "gallery"
  | "rsvp"
  | "registry"
  | "footer"
  | "countdown"
  | "location"
  | "accommodations";

export interface Section {
  id: string;
  type: SectionType;
  props: Record<string, any>;
  order: number;
}

export interface SiteContent {
  theme: SiteTheme;
  sections: Section[];
  settings: SiteSettings;
}

export interface ComponentDefinition {
  type: SectionType;
  name: string;
  description: string;
  icon: string;
  category: "hero" | "content" | "interactive" | "footer";
}

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  {
    type: "hero",
    name: "Hero",
    description: "Big headline with couple names and wedding date",
    icon: "sparkles",
    category: "hero",
  },
  {
    type: "countdown",
    name: "Countdown",
    description: "Countdown timer to the wedding date",
    icon: "clock",
    category: "hero",
  },
  {
    type: "story",
    name: "Our Story",
    description: "Share your love story with text and images",
    icon: "book-heart",
    category: "content",
  },
  {
    type: "timeline",
    name: "Timeline",
    description: "Visual timeline of your relationship milestones",
    icon: "git-branch",
    category: "content",
  },
  {
    type: "gallery",
    name: "Photo Gallery",
    description: "Grid of engagement and couple photos",
    icon: "images",
    category: "content",
  },
  {
    type: "location",
    name: "Location",
    description: "Venue details with map",
    icon: "map-pin",
    category: "content",
  },
  {
    type: "accommodations",
    name: "Accommodations",
    description: "Hotel recommendations for guests",
    icon: "bed",
    category: "content",
  },
  {
    type: "rsvp",
    name: "RSVP Form",
    description: "Guest response form with meal options",
    icon: "clipboard-check",
    category: "interactive",
  },
  {
    type: "registry",
    name: "Gift Registry",
    description: "Links to your gift registries",
    icon: "gift",
    category: "interactive",
  },
  {
    type: "footer",
    name: "Footer",
    description: "Closing section with social links",
    icon: "copyright",
    category: "footer",
  },
];

export const COMPONENT_CATEGORIES = {
  hero: "Header Sections",
  content: "Content Sections",
  interactive: "Interactive",
  footer: "Footer",
} as const;
