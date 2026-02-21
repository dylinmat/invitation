"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionRenderer } from "./section-renderer";
import type { SiteContent, Section } from "./types";

interface CanvasProps {
  siteId: string;
  content: SiteContent | null;
  onChange: (content: SiteContent) => void;
  previewMode: boolean;
  device: "desktop" | "mobile";
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  onReorderSections: (activeId: string, overId: string) => void;
}

// Sortable Section Wrapper
function SortableSection({
  section,
  theme,
  previewMode,
  isSelected,
  onClick,
}: {
  section: Section;
  theme: SiteContent["theme"];
  previewMode: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id, disabled: previewMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {!previewMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <div className="p-1.5 bg-background border rounded shadow-sm">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      <SectionRenderer
        section={section}
        theme={theme}
        previewMode={previewMode}
        isSelected={isSelected}
        onClick={onClick}
      />
    </div>
  );
}

export function Canvas({
  content,
  previewMode,
  device,
  selectedSectionId,
  onSelectSection,
  onReorderSections,
}: CanvasProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        onReorderSections(active.id as string, over.id as string);
      }
    },
    [onReorderSections]
  );

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Deselect when clicking empty canvas area
    if (e.target === e.currentTarget) {
      onSelectSection(null);
    }
  };

  if (!content) {
    return (
      <main className="flex-1 bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded mx-auto" />
            <div className="h-4 w-32 bg-muted rounded mx-auto" />
          </div>
        </div>
      </main>
    );
  }

  const sortedSections = [...content.sections].sort((a, b) => a.order - b.order);

  const canvasWidth = device === "mobile" ? "375px" : "100%";
  const maxWidth = device === "mobile" ? "375px" : "1200px";

  return (
    <main
      className="flex-1 bg-muted/30 overflow-auto"
      onClick={handleCanvasClick}
    >
      <div className="min-h-full p-8 flex justify-center">
        <motion.div
          layout
          className="bg-background shadow-xl"
          style={{
            width: canvasWidth,
            maxWidth,
            minHeight: "calc(100vh - 8rem)",
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {previewMode ? (
            // Preview Mode - No drag and drop
            <div className="divide-y divide-border/50">
              {sortedSections.map((section) => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  theme={content.theme}
                  previewMode={true}
                  isSelected={false}
                  onClick={() => {}}
                />
              ))}
            </div>
          ) : (
            // Edit Mode - With drag and drop
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedSections.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="divide-y divide-border/50">
                  {sortedSections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      theme={content.theme}
                      previewMode={false}
                      isSelected={selectedSectionId === section.id}
                      onClick={() => onSelectSection(section.id)}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeId ? (
                  <div className="opacity-80 rotate-2 scale-[1.02] shadow-2xl">
                    {(() => {
                      const section = sortedSections.find((s) => s.id === activeId);
                      if (!section) return null;
                      return (
                        <SectionRenderer
                          section={section}
                          theme={content.theme}
                          previewMode={true}
                          isSelected={false}
                          onClick={() => {}}
                        />
                      );
                    })()}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* Empty State */}
          {sortedSections.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start building your page</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Add sections from the sidebar to create your wedding website. Start with a Hero section!
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Device Frame Label */}
      {device === "mobile" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
          Mobile Preview (375px)
        </div>
      )}
    </main>
  );
}
