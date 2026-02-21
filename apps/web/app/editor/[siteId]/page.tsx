"use client";

import { useParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSiteContent } from "@/hooks/useSite";
import { Canvas, Toolbar, Sidebar, PropertiesPanel } from "@/components/editor";
import type { Section } from "@/components/editor/types";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/useToast";

// Keyboard shortcuts
function useKeyboardShortcuts({
  onSave,
  onUndo,
  onRedo,
  onPreviewToggle,
  canUndo,
  canRedo,
}: {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreviewToggle: () => void;
  canUndo: boolean;
  canRedo: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onSave();
      }

      // Ctrl/Cmd + Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) onUndo();
      }

      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z - Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        if (canRedo) onRedo();
      }

      // Ctrl/Cmd + P - Preview
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        onPreviewToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave, onUndo, onRedo, onPreviewToggle, canUndo, canRedo]);
}

export default function EditorPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const { toast } = useToast();

  // Editor state
  const [previewMode, setPreviewMode] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Site content hook
  const {
    content,
    isLoading,
    error,
    undo,
    redo,
    canUndo,
    canRedo,
    isSaving,
    saveError,
    saveNow,
    publish,
    unpublish,
    isPublishing,
    addSection,
    removeSection,
    updateSectionProps,
    reorderSections,
    updateTheme,
    updateSettings,
  } = useSiteContent(siteId);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: saveNow,
    onUndo: undo,
    onRedo: redo,
    onPreviewToggle: () => setPreviewMode((prev) => !prev),
    canUndo,
    canRedo,
  });

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading site",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (saveError) {
      toast({
        title: "Save failed",
        description: saveError.message,
        variant: "destructive",
      });
    }
  }, [saveError, toast]);

  // Handlers
  const handleAddSection = useCallback(
    (type: Section["type"]) => {
      const newSectionId = addSection(type);
      setSelectedSectionId(newSectionId);
      toast({
        title: "Section added",
        description: `Added ${type} section to your page`,
      });
    },
    [addSection, toast]
  );

  const handleRemoveSection = useCallback(
    (sectionId: string) => {
      removeSection(sectionId);
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
      }
      toast({
        title: "Section removed",
        description: "The section has been deleted",
      });
    },
    [removeSection, selectedSectionId, toast]
  );

  const handleMoveSection = useCallback(
    (sectionId: string, direction: "up" | "down") => {
      if (!content) return;

      const sections = [...content.sections].sort((a, b) => a.order - b.order);
      const currentIndex = sections.findIndex((s) => s.id === sectionId);

      if (direction === "up" && currentIndex > 0) {
        reorderSections(sectionId, sections[currentIndex - 1].id);
      } else if (direction === "down" && currentIndex < sections.length - 1) {
        reorderSections(sectionId, sections[currentIndex + 1].id);
      }
    },
    [content, reorderSections]
  );

  const handlePublish = useCallback(() => {
    publish(undefined, {
      onSuccess: () => {
        toast({
          title: "Site published!",
          description: "Your wedding website is now live",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Publish failed",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  }, [publish, toast]);

  const handleUnpublish = useCallback(() => {
    unpublish?.(undefined, {
      onSuccess: () => {
        toast({
          title: "Site unpublished",
          description: "Your site is no longer visible to the public",
        });
      },
    });
  }, [unpublish, toast]);

  // Get selected section
  const selectedSection = selectedSectionId
    ? content?.sections.find((s) => s.id === selectedSectionId) || null
    : null;

  // Calculate move availability
  const sortedSections = content?.sections ? [...content.sections].sort((a, b) => a.order - b.order) : [];
  const selectedIndex = selectedSectionId
    ? sortedSections.findIndex((s) => s.id === selectedSectionId)
    : -1;
  const canMoveUp = selectedIndex > 0;
  const canMoveDown = selectedIndex >= 0 && selectedIndex < sortedSections.length - 1;

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !content) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-semibold mb-2">Failed to load editor</h1>
          <p className="text-muted-foreground mb-4">
            {error?.message || "Unable to load site content. Please try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary hover:underline"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <Toolbar
        siteName={content.settings.title}
        siteStatus="draft"
        previewMode={previewMode}
        device={device}
        isSaving={isSaving}
        saveError={saveError}
        canUndo={canUndo}
        canRedo={canRedo}
        onPreviewToggle={() => setPreviewMode((prev) => !prev)}
        onDeviceChange={setDevice}
        onUndo={undo}
        onRedo={redo}
        onSave={saveNow}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        isPublishing={isPublishing}
        lastSaved={new Date()}
      />

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Hidden in preview mode */}
        <AnimatePresence mode="popLayout">
          {!previewMode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <Sidebar
                sections={content.sections}
                onAddSection={handleAddSection}
                onSelectSection={setSelectedSectionId}
                selectedSectionId={selectedSectionId}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <Canvas
          siteId={siteId}
          content={content}
          onChange={() => {}} // Handled internally via hooks
          previewMode={previewMode}
          device={device}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
          onReorderSections={reorderSections}
        />

        {/* Right Sidebar - Properties Panel - Hidden in preview mode */}
        <AnimatePresence mode="popLayout">
          {!previewMode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <PropertiesPanel
                section={selectedSection}
                theme={content.theme}
                onUpdateProps={updateSectionProps}
                onUpdateSection={() => {}}
                onRemoveSection={handleRemoveSection}
                onMoveSection={handleMoveSection}
                canMoveUp={canMoveUp}
                canMoveDown={canMoveDown}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}
