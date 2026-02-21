"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type,
  Image,
  Palette,
  Layout,
  Settings,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Section, SiteContent, SiteTheme } from "./types";

interface PropertiesPanelProps {
  section: Section | null;
  theme: SiteTheme;
  onUpdateProps: (sectionId: string, props: Record<string, any>) => void;
  onUpdateSection: (sectionId: string, updates: Partial<Section>) => void;
  onRemoveSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: "up" | "down") => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function PropertiesPanel({
  section,
  theme,
  onUpdateProps,
  onUpdateSection,
  onRemoveSection,
  onMoveSection,
  canMoveUp,
  canMoveDown,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState("content");

  if (!section) {
    return (
      <aside className="w-80 bg-background border-l flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div className="text-muted-foreground">
            <Layout className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select a section to edit its properties</p>
          </div>
        </div>
      </aside>
    );
  }

  const handlePropChange = (key: string, value: any) => {
    onUpdateProps(section.id, { [key]: value });
  };

  return (
    <aside className="w-80 bg-background border-l flex flex-col shrink-0">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold capitalize">{section.type} Section</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMoveSection(section.id, "up")}
              disabled={!canMoveUp}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMoveSection(section.id, "down")}
              disabled={!canMoveDown}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="content" className="text-xs">
              Content
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs">
              Style
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="content" className="m-0 p-4 space-y-4">
            <ContentProperties section={section} onChange={handlePropChange} theme={theme} />
          </TabsContent>

          <TabsContent value="style" className="m-0 p-4 space-y-4">
            <StyleProperties section={section} onChange={handlePropChange} theme={theme} />
          </TabsContent>

          <TabsContent value="settings" className="m-0 p-4 space-y-4">
            <SettingsProperties section={section} onChange={handlePropChange} />
          </TabsContent>
        </Tabs>
      </ScrollArea>

      <div className="p-4 border-t">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Section
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Section?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the {section.type} section. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onRemoveSection(section.id)}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </aside>
  );
}

// Content Properties Component
function ContentProperties({
  section,
  onChange,
  theme,
}: {
  section: Section;
  onChange: (key: string, value: any) => void;
  theme: SiteTheme;
}) {
  const { type, props } = section;

  switch (type) {
    case "hero":
      return (
        <div className="space-y-4">
          <PropertyGroup title="Text">
            <TextProperty label="Title" value={props.title} onChange={(v) => onChange("title", v)} />
            <TextProperty label="Subtitle" value={props.subtitle} onChange={(v) => onChange("subtitle", v)} />
            <TextProperty label="Date" value={props.date} onChange={(v) => onChange("date", v)} />
            <TextProperty
              label="Location"
              value={props.location}
              onChange={(v) => onChange("location", v)}
            />
          </PropertyGroup>

          <PropertyGroup title="Background">
            <ImageProperty
              label="Background Image"
              value={props.backgroundImage}
              onChange={(v) => onChange("backgroundImage", v)}
            />
            <SliderProperty
              label="Overlay Opacity"
              value={props.overlayOpacity || 0.4}
              min={0}
              max={1}
              step={0.1}
              onChange={(v) => onChange("overlayOpacity", v)}
            />
          </PropertyGroup>
        </div>
      );

    case "countdown":
      return (
        <div className="space-y-4">
          <TextProperty
            label="Heading"
            value={props.heading}
            onChange={(v) => onChange("heading", v)}
          />
          <TextProperty
            label="Target Date"
            value={props.targetDate}
            onChange={(v) => onChange("targetDate", v)}
            type="datetime-local"
          />
        </div>
      );

    case "story":
      return (
        <div className="space-y-4">
          <TextProperty
            label="Heading"
            value={props.heading}
            onChange={(v) => onChange("heading", v)}
          />
          <ArrayProperty
            label="Paragraphs"
            items={props.paragraphs || []}
            onChange={(v) => onChange("paragraphs", v)}
            renderItem={(item, onChange) => (
              <Textarea value={item} onChange={(e) => onChange(e.target.value)} rows={3} />
            )}
            addLabel="Add Paragraph"
          />
          <ImageProperty
            label="Image"
            value={props.image}
            onChange={(v) => onChange("image", v)}
          />
          <SelectProperty
            label="Image Position"
            value={props.imagePosition || "right"}
            options={[
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            onChange={(v) => onChange("imagePosition", v)}
          />
        </div>
      );

    case "timeline":
      return (
        <div className="space-y-4">
          <TextProperty
            label="Heading"
            value={props.heading}
            onChange={(v) => onChange("heading", v)}
          />
          <TimelineEventsProperty
            events={props.events || []}
            onChange={(v) => onChange("events", v)}
          />
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-4">
          <TextProperty
            label="Heading"
            value={props.heading}
            onChange={(v) => onChange("heading", v)}
          />
          <NumberProperty
            label="Columns"
            value={props.columns || 2}
            min={1}
            max={4}
            onChange={(v) => onChange("columns", v)}
          />
          <SelectProperty
            label="Gap"
            value={props.gap || "medium"}
            options={[
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
            onChange={(v) => onChange("gap", v)}
          />
          <GalleryImagesProperty
            images={props.images || []}
            onChange={(v) => onChange("images", v)}
          />
        </div>
      );

    case "location":
      return (
        <div className="space-y-4">
          <TextProperty
            label="Heading"
            value={props.heading}
            onChange={(v) => onChange("heading", v)}
          />
          <TextProperty
            label="Venue Name"
            value={props.venueName}
            onChange={(v) => onChange("venueName", v)}
          />
          <TextareaProperty
            label="Address"
            value={props.address}
            onChange={(v) => onChange("address", v)}
          />
          <TextareaProperty
            label="Directions"
            value={props.directions}
            onChange={(v) => onChange("directions", v)}
          />
        </div>
      );

    case "rsvp":
      return (
        <div className="space-y-4">
          <TextProperty
            label="Heading"
            value={props.heading}
            onChange={(v) => onChange("heading", v)}
          />
          <TextProperty
            label="Subtitle"
            value={props.subtitle}
            onChange={(v) => onChange("subtitle", v)}
          />
          <SwitchProperty
            label="Allow Plus One"
            checked={props.allowPlusOne}
            onChange={(v) => onChange("allowPlusOne", v)}
          />
          <ArrayProperty
            label="Meal Options"
            items={props.mealOptions || []}
            onChange={(v) => onChange("mealOptions", v)}
            addLabel="Add Option"
          />
        </div>
      );

    case "registry":
      return (
        <div className="space-y-4">
          <TextProperty
            label="Heading"
            value={props.heading}
            onChange={(v) => onChange("heading", v)}
          />
          <TextareaProperty
            label="Subtitle"
            value={props.subtitle}
            onChange={(v) => onChange("subtitle", v)}
          />
          <RegistryStoresProperty
            stores={props.stores || []}
            onChange={(v) => onChange("stores", v)}
          />
        </div>
      );

    case "footer":
      return (
        <div className="space-y-4">
          <TextProperty label="Text" value={props.text} onChange={(v) => onChange("text", v)} />
          <SwitchProperty
            label="Show Date"
            checked={props.showDate}
            onChange={(v) => onChange("showDate", v)}
          />
        </div>
      );

    default:
      return <p className="text-sm text-muted-foreground">No properties available for this section type.</p>;
  }
}

// Style Properties Component
function StyleProperties({
  section,
  onChange,
  theme,
}: {
  section: Section;
  onChange: (key: string, value: any) => void;
  theme: SiteTheme;
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Style properties are inherited from the site theme. Customize the theme in the Theme tab.
        </p>
      </div>

      <PropertyGroup title="Theme Colors">
        <ColorProperty
          label="Primary Color"
          value={theme.primaryColor}
          onChange={() => {}}
          disabled
        />
        <ColorProperty
          label="Secondary Color"
          value={theme.secondaryColor}
          onChange={() => {}}
          disabled
        />
      </PropertyGroup>

      <PropertyGroup title="Typography">
        <TextProperty
          label="Heading Font"
          value={theme.fontHeading}
          onChange={() => {}}
          disabled
        />
        <TextProperty label="Body Font" value={theme.fontBody} onChange={() => {}} disabled />
      </PropertyGroup>
    </div>
  );
}

// Settings Properties Component
function SettingsProperties({
  section,
  onChange,
}: {
  section: Section;
  onChange: (key: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">Section ID: {section.id}</p>
        <p className="text-xs text-muted-foreground">Type: {section.type}</p>
        <p className="text-xs text-muted-foreground">Order: {section.order}</p>
      </div>
    </div>
  );
}

// Property Components
function PropertyGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function TextProperty({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-8"
      />
    </div>
  );
}

function TextareaProperty({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
      />
    </div>
  );
}

function NumberProperty({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || min)}
        className="h-8"
      />
    </div>
  );
}

function SelectProperty({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SwitchProperty({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SliderProperty({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

function ColorProperty({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border"
          style={{ backgroundColor: value }}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-7 w-24 text-xs"
        />
      </div>
    </div>
  );
}

function ImageProperty({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-2">
        {value && (
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img src={value} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex gap-2">
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL"
            className="h-8 flex-1"
          />
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => {}}>
            <Image className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ArrayProperty<T>({
  label,
  items,
  onChange,
  renderItem,
  addLabel,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem?: (item: T, onChange: (value: T) => void, index: number) => React.ReactNode;
  addLabel: string;
}) {
  const addItem = () => {
    onChange([...items, "" as T]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, value: T) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            {renderItem ? (
              <div className="flex-1">{renderItem(item, (v) => updateItem(index, v), index)}</div>
            ) : (
              <Input
                value={item as string}
                onChange={(e) => updateItem(index, e.target.value as T)}
                className="flex-1 h-8"
              />
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(index)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

// Timeline Events Property
function TimelineEventsProperty({
  events,
  onChange,
}: {
  events: { date: string; title: string; description: string }[];
  onChange: (events: { date: string; title: string; description: string }[]) => void;
}) {
  const addEvent = () => {
    onChange([...events, { date: "", title: "", description: "" }]);
  };

  const removeEvent = (index: number) => {
    onChange(events.filter((_, i) => i !== index));
  };

  const updateEvent = (index: number, field: keyof typeof events[0], value: string) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], [field]: value };
    onChange(newEvents);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Events</Label>
      <div className="space-y-3">
        {events.map((event, index) => (
          <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Event {index + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeEvent(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Input
              value={event.date}
              onChange={(e) => updateEvent(index, "date", e.target.value)}
              placeholder="Date (e.g., March 2022)"
              className="h-7 text-sm"
            />
            <Input
              value={event.title}
              onChange={(e) => updateEvent(index, "title", e.target.value)}
              placeholder="Title"
              className="h-7 text-sm"
            />
            <Textarea
              value={event.description}
              onChange={(e) => updateEvent(index, "description", e.target.value)}
              placeholder="Description"
              rows={2}
              className="text-sm"
            />
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={addEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>
    </div>
  );
}

// Gallery Images Property
function GalleryImagesProperty({
  images,
  onChange,
}: {
  images: { src: string; alt: string }[];
  onChange: (images: { src: string; alt: string }[]) => void;
}) {
  const addImage = () => {
    onChange([...images, { src: "", alt: "" }]);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const updateImage = (index: number, field: keyof typeof images[0], value: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [field]: value };
    onChange(newImages);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Images</Label>
      <div className="space-y-2">
        {images.map((image, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0 overflow-hidden">
              {image.src ? (
                <img src={image.src} alt="" className="w-full h-full object-cover" />
              ) : (
                <Image className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <Input
                value={image.src}
                onChange={(e) => updateImage(index, "src", e.target.value)}
                placeholder="Image URL"
                className="h-6 text-xs"
              />
              <Input
                value={image.alt}
                onChange={(e) => updateImage(index, "alt", e.target.value)}
                placeholder="Alt text"
                className="h-6 text-xs"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeImage(index)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={addImage}>
          <Plus className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>
    </div>
  );
}

// Registry Stores Property
function RegistryStoresProperty({
  stores,
  onChange,
}: {
  stores: { name: string; url: string; logo?: string }[];
  onChange: (stores: { name: string; url: string; logo?: string }[]) => void;
}) {
  const addStore = () => {
    onChange([...stores, { name: "", url: "" }]);
  };

  const removeStore = (index: number) => {
    onChange(stores.filter((_, i) => i !== index));
  };

  const updateStore = (index: number, field: keyof typeof stores[0], value: string) => {
    const newStores = [...stores];
    newStores[index] = { ...newStores[index], [field]: value };
    onChange(newStores);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs">Stores</Label>
      <div className="space-y-2">
        {stores.map((store, index) => (
          <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Store {index + 1}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStore(index)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Input
              value={store.name}
              onChange={(e) => updateStore(index, "name", e.target.value)}
              placeholder="Store name"
              className="h-7 text-sm"
            />
            <Input
              value={store.url}
              onChange={(e) => updateStore(index, "url", e.target.value)}
              placeholder="Store URL"
              className="h-7 text-sm"
            />
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={addStore}>
          <Plus className="h-4 w-4 mr-2" />
          Add Store
        </Button>
      </div>
    </div>
  );
}
