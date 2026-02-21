"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  LayoutTemplate,
  Settings,
  Palette,
  Plus,
  Sparkles,
  BookHeart,
  GitBranch,
  Images,
  MapPin,
  Bed,
  ClipboardCheck,
  Gift,
  Copyright,
  Clock,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { COMPONENT_DEFINITIONS, COMPONENT_CATEGORIES, type SectionType } from "./types";

interface SidebarProps {
  sections: { id: string; type: SectionType; order: number }[];
  onAddSection: (type: SectionType) => void;
  onSelectSection: (id: string) => void;
  selectedSectionId: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-4 w-4" />,
  "book-heart": <BookHeart className="h-4 w-4" />,
  "git-branch": <GitBranch className="h-4 w-4" />,
  images: <Images className="h-4 w-4" />,
  "map-pin": <MapPin className="h-4 w-4" />,
  bed: <Bed className="h-4 w-4" />,
  "clipboard-check": <ClipboardCheck className="h-4 w-4" />,
  gift: <Gift className="h-4 w-4" />,
  copyright: <Copyright className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
};

export function Sidebar({
  sections,
  onAddSection,
  onSelectSection,
  selectedSectionId,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState("components");

  const groupedComponents = COMPONENT_DEFINITIONS.reduce((acc, component) => {
    if (!acc[component.category]) {
      acc[component.category] = [];
    }
    acc[component.category].push(component);
    return acc;
  }, {} as Record<string, typeof COMPONENT_DEFINITIONS>);

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="w-72 bg-muted/30 border-r flex flex-col shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="px-3 pt-3 pb-2">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="components" className="text-xs">
                <Layers className="h-3.5 w-3.5 mr-1.5" />
                Add
              </TabsTrigger>
              <TabsTrigger value="sections" className="text-xs">
                <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />
                Sections
              </TabsTrigger>
              <TabsTrigger value="theme" className="text-xs">
                <Palette className="h-3.5 w-3.5 mr-1.5" />
                Theme
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="components" className="m-0 px-3 pb-3">
              <div className="space-y-4">
                {Object.entries(groupedComponents).map(([category, components]) => (
                  <div key={category}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      {COMPONENT_CATEGORIES[category as keyof typeof COMPONENT_CATEGORIES]}
                    </h4>
                    <div className="space-y-1">
                      {components.map((component) => (
                        <ComponentCard
                          key={component.type}
                          component={component}
                          onClick={() => onAddSection(component.type)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sections" className="m-0 px-3 pb-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Page Sections
                  </h4>
                  <Badge variant="secondary" className="text-[10px]">
                    {sections.length}
                  </Badge>
                </div>

                {sections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <LayoutTemplate className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sections yet</p>
                    <p className="text-xs mt-1">Add sections from the Components tab</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sections
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => {
                        const component = COMPONENT_DEFINITIONS.find(
                          (c) => c.type === section.type
                        );
                        return (
                          <SectionListItem
                            key={section.id}
                            section={section}
                            component={component}
                            index={index}
                            isSelected={selectedSectionId === section.id}
                            onClick={() => onSelectSection(section.id)}
                          />
                        );
                      })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="theme" className="m-0 px-3 pb-3">
              <div className="space-y-4">
                <div className="p-3 bg-card rounded-lg border">
                  <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                      <Palette className="h-4 w-4 mr-2" />
                      Edit Colors
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-sm" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Site Settings
                    </Button>
                  </div>
                </div>

                <div className="p-3 bg-card rounded-lg border">
                  <h4 className="text-sm font-medium mb-3">Templates</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {["Classic", "Modern", "Rustic", "Elegant"].map((template) => (
                      <button
                        key={template}
                        className="aspect-[4/3] rounded-md bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center text-xs font-medium"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </aside>
    </TooltipProvider>
  );
}

interface ComponentCardProps {
  component: (typeof COMPONENT_DEFINITIONS)[0];
  onClick: () => void;
}

function ComponentCard({ component, onClick }: ComponentCardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-card border hover:border-primary/50 hover:shadow-sm transition-all group text-left"
        >
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
            {iconMap[component.icon] || <Plus className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{component.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {component.description}
            </p>
          </div>
          <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>Add {component.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface SectionListItemProps {
  section: { id: string; type: SectionType; order: number };
  component: (typeof COMPONENT_DEFINITIONS)[0] | undefined;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function SectionListItem({
  section,
  component,
  index,
  isSelected,
  onClick,
}: SectionListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 p-2.5 rounded-lg border transition-all text-left group ${
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-card hover:border-primary/30 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center gap-1.5">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100" />
        <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
      </div>
      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
        {component ? iconMap[component.icon] : <Layers className="h-3 w-3" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{component?.name || section.type}</p>
      </div>
      <ChevronRight
        className={`h-4 w-4 text-muted-foreground transition-transform ${
          isSelected ? "rotate-90" : ""
        }`}
      />
    </button>
  );
}
