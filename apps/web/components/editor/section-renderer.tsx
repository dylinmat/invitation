"use client";

import { motion } from "framer-motion";
import {
  Heart,
  Calendar,
  MapPin,
  Clock,
  Gift,
  CheckCircle,
  Image as ImageIcon,
  Copyright,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Section, SiteTheme } from "./types";

interface SectionRendererProps {
  section: Section;
  theme: SiteTheme;
  previewMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export function SectionRenderer({
  section,
  theme,
  previewMode,
  isSelected,
  onClick,
}: SectionRendererProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (!previewMode) {
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <motion.div
      layoutId={section.id}
      onClick={handleClick}
      className={`relative ${!previewMode ? "cursor-pointer" : ""} ${
        isSelected && !previewMode ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
      style={{
        fontFamily: theme.fontBody,
      }}
    >
      {/* Section Type Badge (shown when selected) */}
      {!previewMode && isSelected && (
        <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-t-md z-10">
          {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
        </div>
      )}

      {/* Section Content */}
      <div className="relative">
        <SectionContent section={section} theme={theme} previewMode={previewMode} />
      </div>

      {/* Hover Overlay for Editing */}
      {!previewMode && !isSelected && (
        <div className="absolute inset-0 bg-primary/0 hover:bg-primary/5 transition-colors pointer-events-none" />
      )}
    </motion.div>
  );
}

function SectionContent({
  section,
  theme,
  previewMode,
}: {
  section: Section;
  theme: SiteTheme;
  previewMode: boolean;
}) {
  switch (section.type) {
    case "hero":
      return <HeroSection props={section.props} theme={theme} />;
    case "countdown":
      return <CountdownSection props={section.props} theme={theme} />;
    case "story":
      return <StorySection props={section.props} theme={theme} />;
    case "timeline":
      return <TimelineSection props={section.props} theme={theme} />;
    case "gallery":
      return <GallerySection props={section.props} theme={theme} />;
    case "location":
      return <LocationSection props={section.props} theme={theme} />;
    case "rsvp":
      return <RSVPSection props={section.props} theme={theme} previewMode={previewMode} />;
    case "registry":
      return <RegistrySection props={section.props} theme={theme} />;
    case "footer":
      return <FooterSection props={section.props} theme={theme} />;
    default:
      return <div className="p-8 text-center text-muted-foreground">Unknown section type</div>;
  }
}

// Hero Section
function HeroSection({ props, theme }: { props: Record<string, any>; theme: SiteTheme }) {
  return (
    <section
      className="relative min-h-[70vh] flex items-center justify-center py-20 px-4"
      style={{
        backgroundImage: props.backgroundImage
          ? `linear-gradient(rgba(0,0,0,${props.overlayOpacity || 0.4}), rgba(0,0,0,${
              props.overlayOpacity || 0.4
            })), url(${props.backgroundImage})`
          : `linear-gradient(135deg, ${theme.primaryColor}20, ${theme.secondaryColor}20)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="text-center max-w-3xl mx-auto">
        <h1
          className="text-5xl md:text-7xl font-bold mb-4"
          style={{ fontFamily: theme.fontHeading, color: props.backgroundImage ? "white" : "inherit" }}
        >
          {props.title || "Couple Names"}
        </h1>
        <p
          className="text-xl md:text-2xl mb-2"
          style={{ color: props.backgroundImage ? "white" : "inherit" }}
        >
          {props.subtitle || "Are getting married"}
        </p>
        {props.date && (
          <p
            className="text-lg md:text-xl flex items-center justify-center gap-2"
            style={{ color: props.backgroundImage ? "white" : "inherit" }}
          >
            <Calendar className="h-5 w-5" />
            {props.date}
          </p>
        )}
        {props.location && (
          <p
            className="text-lg flex items-center justify-center gap-2 mt-2"
            style={{ color: props.backgroundImage ? "white" : "inherit" }}
          >
            <MapPin className="h-5 w-5" />
            {props.location}
          </p>
        )}
      </div>
    </section>
  );
}

// Countdown Section
function CountdownSection({ props, theme }: { props: Record<string, any>; theme: SiteTheme }) {
  return (
    <section
      className="py-16 px-4 text-center"
      style={{ backgroundColor: theme.primaryColor + "10" }}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: theme.fontHeading }}>
          {props.heading || "Counting down to our special day"}
        </h2>
        <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
          {[
            { value: "00", label: "Days" },
            { value: "00", label: "Hours" },
            { value: "00", label: "Minutes" },
            { value: "00", label: "Seconds" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div
                className="text-3xl md:text-4xl font-bold rounded-lg py-4"
                style={{ backgroundColor: theme.primaryColor, color: "white" }}
              >
                {item.value}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Story Section
function StorySection({ props, theme }: { props: Record<string, any>; theme: SiteTheme }) {
  const imagePosition = props.imagePosition || "right";

  return (
    <section className="py-16 px-4 max-w-5xl mx-auto">
      <div
        className={`grid md:grid-cols-2 gap-8 items-center ${
          imagePosition === "left" ? "md:flex-row-reverse" : ""
        }`}
      >
        <div className={imagePosition === "left" ? "md:order-2" : ""}>
          <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: theme.fontHeading }}>
            {props.heading || "Our Story"}
          </h2>
          <div className="space-y-4 text-muted-foreground">
            {Array.isArray(props.paragraphs) ? (
              props.paragraphs.map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))
            ) : (
              <p>{props.paragraphs || "Add your love story here..."}</p>
            )}
          </div>
        </div>
        <div
          className={`${imagePosition === "left" ? "md:order-1" : ""} ${
            props.image ? "" : "bg-muted rounded-lg aspect-[4/3] flex items-center justify-center"
          }`}
        >
          {props.image ? (
            <img
              src={props.image}
              alt="Our story"
              className="w-full h-auto rounded-lg object-cover aspect-[4/3]"
            />
          ) : (
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          )}
        </div>
      </div>
    </section>
  );
}

// Timeline Section
function TimelineSection({ props, theme }: { props: Record<string, any>; theme: SiteTheme }) {
  const events = props.events || [];

  return (
    <section className="py-16 px-4 max-w-4xl mx-auto">
      <h2
        className="text-3xl font-bold mb-12 text-center"
        style={{ fontFamily: theme.fontHeading }}
      >
        {props.heading || "Our Journey"}
      </h2>
      <div className="relative">
        <div
          className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 -ml-[1px]"
          style={{ backgroundColor: theme.primaryColor }}
        />
        <div className="space-y-8">
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground">No timeline events yet</p>
          ) : (
            events.map((event: any, index: number) => (
              <div
                key={index}
                className={`relative flex items-start ${
                  index % 2 === 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="hidden md:block md:w-1/2" />
                <div
                  className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full -ml-2 border-4 border-background"
                  style={{ backgroundColor: theme.primaryColor }}
                />
                <div className="ml-12 md:ml-0 md:w-1/2 md:px-8">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <span
                      className="text-sm font-medium"
                      style={{ color: theme.primaryColor }}
                    >
                      {event.date}
                    </span>
                    <h3 className="font-semibold mt-1">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

// Gallery Section
function GallerySection({ props, theme }: { props: Record<string, any>; theme: SiteTheme }) {
  const images = props.images || [];
  const columns = props.columns || 2;
  const gap = props.gap || "medium";

  const gapClasses = {
    small: "gap-2",
    medium: "gap-4",
    large: "gap-6",
  };

  return (
    <section className="py-16 px-4 max-w-5xl mx-auto">
      <h2
        className="text-3xl font-bold mb-8 text-center"
        style={{ fontFamily: theme.fontHeading }}
      >
        {props.heading || "Photo Gallery"}
      </h2>
      <div className={`grid grid-cols-2 md:grid-cols-${columns} ${gapClasses[gap as keyof typeof gapClasses]}`}>
        {images.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg">
            <Images className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">No photos added yet</p>
          </div>
        ) : (
          images.map((image: any, index: number) => (
            <div key={index} className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              {image.src ? (
                <img
                  src={image.src}
                  alt={image.alt || `Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

// Location Section
function LocationSection({ props, theme }: { props: Record<string, any>; theme: SiteTheme }) {
  return (
    <section className="py-16 px-4 max-w-4xl mx-auto">
      <h2
        className="text-3xl font-bold mb-8 text-center"
        style={{ fontFamily: theme.fontHeading }}
      >
        {props.heading || "Wedding Location"}
      </h2>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-0.5 shrink-0" style={{ color: theme.primaryColor }} />
            <div>
              <h3 className="font-semibold">{props.venueName || "Venue Name"}</h3>
              <p className="text-muted-foreground">{props.address || "Address not set"}</p>
            </div>
          </div>
          {props.directions && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{props.directions}</p>
            </div>
          )}
        </div>
        <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
          <MapPin className="h-12 w-12 text-muted-foreground/50" />
        </div>
      </div>
    </section>
  );
}

// RSVP Section
function RSVPSection({
  props,
  theme,
  previewMode,
}: {
  props: Record<string, any>;
  theme: SiteTheme;
  previewMode: boolean;
}) {
  const mealOptions = props.mealOptions || [];

  return (
    <section
      className="py-16 px-4"
      style={{ backgroundColor: theme.primaryColor + "10" }}
    >
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ fontFamily: theme.fontHeading }}
          >
            {props.heading || "RSVP"}
          </h2>
          {props.subtitle && <p className="text-muted-foreground">{props.subtitle}</p>}
        </div>

        <form className="space-y-6 bg-card p-6 rounded-xl shadow-sm" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" disabled={!previewMode} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" disabled={!previewMode} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" disabled={!previewMode} />
            </div>

            {props.allowPlusOne && (
              <div className="flex items-center space-x-2">
                <Checkbox id="plusOne" disabled={!previewMode} />
                <Label htmlFor="plusOne">Bringing a plus one</Label>
              </div>
            )}

            {mealOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="meal">Meal Preference</Label>
                <Select disabled={!previewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a meal" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealOptions.map((option: string) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Leave a message for the couple..."
                disabled={!previewMode}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: theme.primaryColor }}
            disabled={!previewMode}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Submit RSVP
          </Button>
        </form>
      </div>
    </section>
  );
}

// Registry Section
function RegistrySection({ props, theme }: { props: Record<string, any>; theme: SiteTheme }) {
  const stores = props.stores || [];

  return (
    <section className="py-16 px-4 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <Gift className="h-12 w-12 mx-auto mb-4" style={{ color: theme.primaryColor }} />
        <h2
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: theme.fontHeading }}
        >
          {props.heading || "Gift Registry"}
        </h2>
        {props.subtitle && <p className="text-muted-foreground max-w-lg mx-auto">{props.subtitle}</p>}
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {stores.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No registries added yet</p>
          </div>
        ) : (
          stores.map((store: any, index: number) => (
            <a
              key={index}
              href={store.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <Gift className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="font-medium">{store.name}</span>
            </a>
          ))
        )}
      </div>
    </section>
  );
}

// Footer Section
function FooterSection({ props, theme }: { props: Record<string, any>; theme: SiteTheme }) {
  const socialLinks = props.socialLinks || [];

  return (
    <footer
      className="py-12 px-4 text-center"
      style={{ backgroundColor: theme.secondaryColor + "10" }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Heart className="h-8 w-8 mx-auto" style={{ color: theme.primaryColor }} />

        <p className="text-lg font-medium">{props.text || "Made with love"}</p>

        {props.showDate && (
          <p className="text-sm text-muted-foreground">
            {new Date().getFullYear()}
          </p>
        )}

        {socialLinks.length > 0 && (
          <div className="flex items-center justify-center gap-4">
            {socialLinks.map((link: any, index: number) => (
              <a
                key={index}
                href={link.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-card border flex items-center justify-center hover:border-primary/50 transition-colors"
              >
                <span className="text-sm font-medium capitalize">{link.platform[0]}</span>
              </a>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Created with EIOS Wedding Builder
        </p>
      </div>
    </footer>
  );
}
