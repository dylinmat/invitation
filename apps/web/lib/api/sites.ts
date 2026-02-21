"use client";

import { api } from "@/lib/api";

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

export interface Section {
  id: string;
  type: "hero" | "story" | "timeline" | "gallery" | "rsvp" | "registry" | "footer" | "countdown" | "location" | "accommodations";
  props: Record<string, any>;
  order: number;
}

export interface SiteContent {
  theme: SiteTheme;
  sections: Section[];
  settings: SiteSettings;
}

export interface Site {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
  content: SiteContent;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

const defaultTheme: SiteTheme = {
  primaryColor: "#d4a574",
  secondaryColor: "#8b7355",
  fontHeading: "Playfair Display",
  fontBody: "Inter",
};

const defaultSettings: SiteSettings = {
  title: "Our Wedding",
  description: "Join us in celebrating our special day",
};

const defaultSections: Section[] = [
  {
    id: "hero-1",
    type: "hero",
    order: 0,
    props: {
      title: "Emma & James",
      subtitle: "Are getting married",
      date: "June 15, 2025",
      location: "Garden Estate, California",
      backgroundImage: "",
      overlayOpacity: 0.4,
    },
  },
  {
    id: "countdown-1",
    type: "countdown",
    order: 1,
    props: {
      targetDate: "2025-06-15T16:00:00",
      heading: "Counting down to our special day",
    },
  },
  {
    id: "story-1",
    type: "story",
    order: 2,
    props: {
      heading: "Our Love Story",
      paragraphs: [
        "We first met at a coffee shop in downtown San Francisco. What started as a casual conversation over lattes quickly turned into something magical.",
        "Three years later, James proposed during a sunset hike overlooking the Golden Gate Bridge. It was the perfect moment, and we couldn't be more excited to start this new chapter together.",
      ],
      image: "",
      imagePosition: "right",
    },
  },
  {
    id: "timeline-1",
    type: "timeline",
    order: 3,
    props: {
      heading: "Our Journey",
      events: [
        { date: "March 2022", title: "First Meeting", description: "Met at Blue Bottle Coffee" },
        { date: "June 2022", title: "First Date", description: "Dinner at Italian restaurant" },
        { date: "December 2022", title: "Official", description: "Started dating officially" },
        { date: "September 2024", title: "The Proposal", description: "Engaged on sunset hike" },
      ],
    },
  },
  {
    id: "gallery-1",
    type: "gallery",
    order: 4,
    props: {
      heading: "Photo Gallery",
      images: [
        { src: "", alt: "Engagement photo 1" },
        { src: "", alt: "Engagement photo 2" },
        { src: "", alt: "Engagement photo 3" },
        { src: "", alt: "Engagement photo 4" },
      ],
      columns: 2,
      gap: "medium",
    },
  },
  {
    id: "location-1",
    type: "location",
    order: 5,
    props: {
      heading: "Wedding Location",
      venueName: "Garden Estate",
      address: "123 Garden Lane, Napa Valley, CA 94558",
      mapUrl: "",
      directions: "Parking is available on-site. Please arrive 30 minutes early.",
    },
  },
  {
    id: "rsvp-1",
    type: "rsvp",
    order: 6,
    props: {
      heading: "RSVP",
      subtitle: "Please respond by May 1, 2025",
      deadline: "2025-05-01",
      allowPlusOne: true,
      mealOptions: ["Beef", "Chicken", "Vegetarian", "Vegan"],
      questions: [
        { id: "dietary", label: "Any dietary restrictions?", type: "text" },
      ],
    },
  },
  {
    id: "registry-1",
    type: "registry",
    order: 7,
    props: {
      heading: "Gift Registry",
      subtitle: "Your presence is the greatest gift, but if you'd like to celebrate with a gift, we've registered at:",
      stores: [
        { name: "Crate & Barrel", url: "#", logo: "" },
        { name: "Williams Sonoma", url: "#", logo: "" },
        { name: "Amazon", url: "#", logo: "" },
      ],
    },
  },
  {
    id: "footer-1",
    type: "footer",
    order: 8,
    props: {
      text: "Made with love by Emma & James",
      showDate: true,
      socialLinks: [
        { platform: "instagram", url: "#" },
        { platform: "facebook", url: "#" },
      ],
    },
  },
];

// Mock data for development - in production this would be API calls
const sitesStore: Map<string, Site> = new Map();

export async function getSite(siteId: string): Promise<Site> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const existing = sitesStore.get(siteId);
  if (existing) return existing;

  // Create default site if not exists
  const newSite: Site = {
    id: siteId,
    name: "Wedding Website",
    slug: `wedding-${siteId.slice(0, 8)}`,
    status: "draft",
    content: {
      theme: { ...defaultTheme },
      sections: [...defaultSections],
      settings: { ...defaultSettings },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  sitesStore.set(siteId, newSite);
  return newSite;
}

export async function getSiteContent(siteId: string): Promise<SiteContent> {
  const site = await getSite(siteId);
  return site.content;
}

export async function updateSiteContent(siteId: string, content: SiteContent): Promise<void> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const site = sitesStore.get(siteId);
  if (site) {
    site.content = content;
    site.updatedAt = new Date().toISOString();
    sitesStore.set(siteId, site);
  }

  console.log(`[API] Site content updated for ${siteId}`);
}

export async function publishSite(siteId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const site = sitesStore.get(siteId);
  if (site) {
    site.status = "published";
    site.publishedAt = new Date().toISOString();
    sites.updateSite(siteId, site);
  }

  console.log(`[API] Site published: ${siteId}`);
}

export async function unpublishSite(siteId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const site = sitesStore.get(siteId);
  if (site) {
    site.status = "draft";
    site.publishedAt = undefined;
    sitesStore.set(siteId, site);
  }
}

export function createDefaultSection(type: Section["type"]): Section {
  const id = `${type}-${Date.now()}`;
  const order = Date.now();

  const sectionTemplates: Record<Section["type"], Record<string, any>> = {
    hero: {
      title: "Couple Names",
      subtitle: "Are getting married",
      date: "",
      location: "",
      backgroundImage: "",
      overlayOpacity: 0.4,
    },
    story: {
      heading: "Our Story",
      paragraphs: ["Add your love story here..."],
      image: "",
      imagePosition: "right",
    },
    timeline: {
      heading: "Our Journey",
      events: [],
    },
    gallery: {
      heading: "Gallery",
      images: [],
      columns: 2,
      gap: "medium",
    },
    rsvp: {
      heading: "RSVP",
      subtitle: "Please let us know if you can make it",
      deadline: "",
      allowPlusOne: false,
      mealOptions: [],
      questions: [],
    },
    registry: {
      heading: "Registry",
      subtitle: "We've registered at the following stores",
      stores: [],
    },
    footer: {
      text: "Made with love",
      showDate: true,
      socialLinks: [],
    },
    countdown: {
      targetDate: "",
      heading: "Counting down to our special day",
    },
    location: {
      heading: "Location",
      venueName: "",
      address: "",
      mapUrl: "",
      directions: "",
    },
    accommodations: {
      heading: "Accommodations",
      hotels: [],
      note: "",
    },
  };

  return {
    id,
    type,
    order,
    props: { ...sectionTemplates[type] },
  };
}

// Helper to upload images (mock implementation)
export async function uploadImage(file: File): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`[API] Image uploaded: ${file.name}`);
  // Return a mock URL - in production this would return the actual uploaded URL
  return URL.createObjectURL(file);
}

// Export sites store for testing/mocking
export const sites = {
  get: (id: string) => sitesStore.get(id),
  set: (id: string, site: Site) => sitesStore.set(id, site),
  updateSite: (id: string, updates: Partial<Site>) => {
    const site = sitesStore.get(id);
    if (site) {
      sitesStore.set(id, { ...site, ...updates, updatedAt: new Date().toISOString() });
    }
  },
};
