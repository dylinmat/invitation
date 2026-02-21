"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  importCSV,
  previewCSV,
  downloadTemplate,
  getTemplateContent,
  parseCSVFile,
  ImportType,
  ImportResult,
  PreviewResult,
  TemplateContent,
  ImportOptions,
} from "@/lib/api/import";
import { showToast } from "@/components/ui/toaster";

// ====================
// Query Keys
// ====================

export const importKeys = {
  all: ["import"] as const,
  preview: (fileName: string) => [...importKeys.all, "preview", fileName] as const,
  template: (type: ImportType) => [...importKeys.all, "template", type] as const,
};

// ====================
// Types
// ====================

export interface ImportProgress {
  status: "idle" | "parsing" | "validating" | "uploading" | "importing" | "complete" | "error";
  progress: number; // 0-100
  message: string;
}

export interface UseImportCSVOptions {
  contextId: string; // Project ID for guests, Organization ID for clients
  onSuccess?: (result: ImportResult) => void;
  onError?: (error: Error) => void;
}

// ====================
// Import CSV Mutation
// ====================

export function useImportCSV(type: ImportType, options: UseImportCSVOptions) {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ImportProgress>({
    status: "idle",
    progress: 0,
    message: "",
  });

  const mutation = useMutation({
    mutationFn: async ({ 
      file, 
      importOptions 
    }: { 
      file: File; 
      importOptions?: ImportOptions;
    }) => {
      // Update progress - parsing
      setProgress({
        status: "parsing",
        progress: 10,
        message: "Parsing CSV file...",
      });

      // Small delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Update progress - validating
      setProgress({
        status: "validating",
        progress: 25,
        message: "Validating data...",
      });

      // Update progress - uploading
      setProgress({
        status: "uploading",
        progress: 50,
        message: "Uploading to server...",
      });

      // Update progress - importing
      setProgress({
        status: "importing",
        progress: 75,
        message: "Importing records...",
      });

      const result = await importCSV(file, type, options.contextId, importOptions);

      // Update progress - complete
      setProgress({
        status: "complete",
        progress: 100,
        message: `Successfully imported ${result.imported} records`,
      });

      return result;
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      if (type === "guests") {
        queryClient.invalidateQueries({ queryKey: ["guests"] });
        queryClient.invalidateQueries({ queryKey: ["projects", options.contextId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["clients"] });
        queryClient.invalidateQueries({ queryKey: ["business-dashboard"] });
      }

      // Show success or partial success toast
      if (result.errors && result.errors.length > 0) {
        if (result.imported > 0) {
          showToast({
            title: "Partial import completed",
            description: `Imported ${result.imported} records, ${result.errors.length} errors`,
            variant: "warning",
          });
        } else {
          showToast({
            title: "Import failed",
            description: result.errors[0],
            variant: "destructive",
          });
        }
      } else if (result.warnings && result.warnings.length > 0) {
        showToast({
          title: "Import completed with warnings",
          description: `Imported ${result.imported} records`,
          variant: "warning",
        });
      } else {
        showToast({
          title: "Import successful",
          description: `Imported ${result.imported} records`,
          variant: "success",
        });
      }

      options.onSuccess?.(result);
    },
    onError: (error: Error) => {
      setProgress({
        status: "error",
        progress: 0,
        message: error.message,
      });

      showToast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });

      options.onError?.(error);
    },
  });

  const resetProgress = useCallback(() => {
    setProgress({
      status: "idle",
      progress: 0,
      message: "",
    });
  }, []);

  return {
    ...mutation,
    progress,
    resetProgress,
  };
}

// ====================
// Preview CSV Mutation
// ====================

export function usePreviewCSV() {
  return useMutation({
    mutationFn: async ({ file, type }: { file: File; type: ImportType }) => {
      return previewCSV(file, type);
    },
    onError: (error: Error) => {
      showToast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ====================
// Local Preview Hook (Client-side only)
// ====================

export function useLocalPreview() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);

  const parsePreview = useCallback(async (file: File, maxRows: number = 5) => {
    setIsLoading(true);
    setError(null);

    try {
      const rows = await parseCSVFile(file);
      setPreview(rows.slice(0, maxRows));
      return rows.slice(0, maxRows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse CSV";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setError(null);
  }, []);

  return {
    preview,
    isLoading,
    error,
    parsePreview,
    clearPreview,
  };
}

// ====================
// Template Download
// ====================

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async (type: ImportType) => {
      await downloadTemplate(type);
    },
    onSuccess: () => {
      showToast({
        title: "Template downloaded",
        description: "Check your downloads folder",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      showToast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// ====================
// Template Content Query
// ====================

export function useTemplateContent(type: ImportType) {
  const [data, setData] = useState<TemplateContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getTemplateContent(type);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load template";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  return {
    data,
    isLoading,
    error,
    fetchTemplate,
  };
}

// ====================
// Import Summary Hook
// ====================

export function useImportSummary(result: ImportResult | null) {
  if (!result) {
    return {
      hasErrors: false,
      hasWarnings: false,
      hasDuplicates: false,
      isPartial: false,
      summaryText: "",
    };
  }

  const hasErrors = result.errors && result.errors.length > 0;
  const hasWarnings = result.warnings && result.warnings.length > 0;
  const hasDuplicates = result.duplicates && result.duplicates > 0;
  const isPartial = result.imported > 0 && (result.invalidRows || 0) > 0;

  let summaryText = "";
  if (result.success) {
    if (isPartial) {
      summaryText = `Imported ${result.imported} of ${result.totalRows} records`;
    } else {
      summaryText = `Successfully imported ${result.imported} records`;
    }
  } else {
    summaryText = "Import failed";
  }

  return {
    hasErrors,
    hasWarnings,
    hasDuplicates,
    isPartial,
    summaryText,
  };
}
