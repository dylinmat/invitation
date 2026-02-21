"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSite,
  getSiteContent,
  updateSiteContent,
  publishSite,
  unpublishSite,
  createDefaultSection,
  uploadImage,
  type Site,
  type SiteContent,
  type Section,
} from "@/lib/api/sites";

const SITE_QUERY_KEY = "site";
const SITE_CONTENT_QUERY_KEY = "site-content";

// History management for undo/redo
interface HistoryState {
  past: SiteContent[];
  present: SiteContent | null;
  future: SiteContent[];
}

export function useSite(siteId: string) {
  return useQuery({
    queryKey: [SITE_QUERY_KEY, siteId],
    queryFn: () => getSite(siteId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSiteContent(siteId: string) {
  const queryClient = useQueryClient();
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: null,
    future: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: [SITE_CONTENT_QUERY_KEY, siteId],
    queryFn: () => getSiteContent(siteId),
    staleTime: 1000 * 60 * 5,
  });

  // Initialize history when data loads
  useEffect(() => {
    if (data && !history.present) {
      setHistory({
        past: [],
        present: data,
        future: [],
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (content: SiteContent) => updateSiteContent(siteId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SITE_CONTENT_QUERY_KEY, siteId] });
      setIsSaving(false);
      setSaveError(null);
    },
    onError: (err) => {
      setIsSaving(false);
      setSaveError(err as Error);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishSite(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SITE_QUERY_KEY, siteId] });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishSite(siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SITE_QUERY_KEY, siteId] });
    },
  });

  // Update content with history tracking
  const updateContent = useCallback(
    (updater: (content: SiteContent) => SiteContent) => {
      setHistory((prev) => {
        if (!prev.present) return prev;

        const newPresent = updater(prev.present);

        return {
          past: [...prev.past, prev.present],
          present: newPresent,
          future: [],
        };
      });
    },
    []
  );

  // Set content directly (for initial load, undo/redo)
  const setContent = useCallback((content: SiteContent) => {
    setHistory((prev) => ({
      past: prev.present ? [...prev.past, prev.present] : prev.past,
      present: content,
      future: [],
    }));
  }, []);

  // Undo
  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [prev.present!, ...prev.future],
      };
    });
  }, []);

  // Redo
  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const next = prev.future[0];
      const newFuture = prev.future.slice(1);

      return {
        past: [...prev.past, prev.present!],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  // Check if undo/redo is available
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // Auto-save effect
  useEffect(() => {
    if (!history.present) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setIsSaving(true);
    autoSaveTimerRef.current = setTimeout(() => {
      updateMutation.mutate(history.present!);
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [history.present, updateMutation]);

  // Section operations
  const addSection = useCallback(
    (type: Section["type"]) => {
      updateContent((content) => {
        const newSection = createDefaultSection(type);
        const maxOrder = Math.max(...content.sections.map((s) => s.order), -1);
        newSection.order = maxOrder + 1;

        return {
          ...content,
          sections: [...content.sections, newSection],
        };
      });

      return newSection.id;
    },
    [updateContent]
  );

  const removeSection = useCallback(
    (sectionId: string) => {
      updateContent((content) => ({
        ...content,
        sections: content.sections.filter((s) => s.id !== sectionId),
      }));
    },
    [updateContent]
  );

  const updateSection = useCallback(
    (sectionId: string, updates: Partial<Section> | ((section: Section) => Section)) => {
      updateContent((content) => ({
        ...content,
        sections: content.sections.map((s) =>
          s.id === sectionId
            ? typeof updates === "function"
              ? updates(s)
              : { ...s, ...updates }
            : s
        ),
      }));
    },
    [updateContent]
  );

  const updateSectionProps = useCallback(
    (sectionId: string, props: Record<string, any>) => {
      updateContent((content) => ({
        ...content,
        sections: content.sections.map((s) =>
          s.id === sectionId ? { ...s, props: { ...s.props, ...props } } : s
        ),
      }));
    },
    [updateContent]
  );

  const reorderSections = useCallback(
    (activeId: string, overId: string) => {
      updateContent((content) => {
        const oldIndex = content.sections.findIndex((s) => s.id === activeId);
        const newIndex = content.sections.findIndex((s) => s.id === overId);

        if (oldIndex === -1 || newIndex === -1) return content;

        const newSections = [...content.sections];
        const [moved] = newSections.splice(oldIndex, 1);
        newSections.splice(newIndex, 0, moved);

        // Update order values
        newSections.forEach((section, index) => {
          section.order = index;
        });

        return { ...content, sections: newSections };
      });
    },
    [updateContent]
  );

  const updateTheme = useCallback(
    (themeUpdates: Partial<SiteContent["theme"]>) => {
      updateContent((content) => ({
        ...content,
        theme: { ...content.theme, ...themeUpdates },
      }));
    },
    [updateContent]
  );

  const updateSettings = useCallback(
    (settingsUpdates: Partial<SiteContent["settings"]>) => {
      updateContent((content) => ({
        ...content,
        settings: { ...content.settings, ...settingsUpdates },
      }));
    },
    [updateContent]
  );

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    return uploadImage(file);
  }, []);

  const saveNow = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    if (history.present) {
      setIsSaving(true);
      updateMutation.mutate(history.present);
    }
  }, [history.present, updateMutation]);

  return {
    // Data
    content: history.present,
    isLoading,
    error,

    // History
    undo,
    redo,
    canUndo,
    canRedo,

    // Saving
    isSaving,
    saveError,
    saveNow,

    // Site operations
    publish: publishMutation.mutate,
    unpublish: unpublishMutation.mutate,
    isPublishing: publishMutation.isPending,
    isUnpublishing: unpublishMutation.isPending,

    // Content operations
    setContent,
    updateContent,

    // Section operations
    addSection,
    removeSection,
    updateSection,
    updateSectionProps,
    reorderSections,

    // Theme & settings
    updateTheme,
    updateSettings,

    // Utilities
    uploadImage: handleImageUpload,
  };
}

export type UseSiteContentReturn = ReturnType<typeof useSiteContent>;
