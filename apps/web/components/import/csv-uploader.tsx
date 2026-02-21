"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertCircle,
  X,
  Download,
  Eye,
  AlertTriangle,
  FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { showToast } from "@/components/ui/toaster";
import {
  useImportCSV,
  usePreviewCSV,
  useLocalPreview,
  useDownloadTemplate,
  useImportSummary,
  ImportType,
  ImportProgress,
} from "@/hooks/useImport";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CsvUploaderProps {
  type: ImportType;
  contextId: string; // Project ID for guests, Organization ID for clients
  maxRows?: number;
  onSuccess?: (result: { imported: number }) => void;
}

export function CsvUploader({
  type,
  contextId,
  maxRows = 1000,
  onSuccess,
}: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Hooks
  const { preview, isLoading: isParsing, error: parseError, parsePreview, clearPreview } = useLocalPreview();
  const { mutateAsync: previewCSV, isPending: isPreviewing } = usePreviewCSV();
  const { mutate: importData, isPending: isImporting, progress, resetProgress } = useImportCSV(type, {
    contextId,
    onSuccess: (result) => {
      setImportResult(result);
      setShowResult(true);
      onSuccess?.({ imported: result.imported });
    },
  });
  const { mutate: downloadTemplate, isPending: isDownloading } = useDownloadTemplate();
  const importSummary = useImportSummary(importResult);

  const isProcessing = isParsing || isPreviewing || isImporting;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.type === "text/csv") {
        await processFile(droppedFile);
      } else {
        showToast({
          title: "Invalid file",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    },
    []
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        await processFile(selectedFile);
      }
    },
    []
  );

  const processFile = async (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    try {
      // Parse local preview first
      await parsePreview(selectedFile, 5);
    } catch (error) {
      showToast({
        title: "Parse error",
        description: error instanceof Error ? error.message : "Failed to parse CSV",
        variant: "destructive",
      });
    }
  };

  const handleConfirmImport = () => {
    if (file) {
      importData({ file });
    }
  };

  const handlePreviewClick = async () => {
    if (file) {
      try {
        const result = await previewCSV({ file, type });
        if (result.success) {
          setShowPreview(true);
        }
      } catch (error) {
        // Error handled by mutation
      }
    }
  };

  const handleClear = () => {
    setFile(null);
    clearPreview();
    resetProgress();
    setImportResult(null);
    setShowResult(false);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate(type);
  };

  const getSupportedColumns = () => {
    if (type === "guests") {
      return "name (required), email, phone, dietary_restrictions, plus_one, table_number";
    }
    return "name (required), email, phone, type, notes, status, address";
  };

  const getProgressColor = (status: ImportProgress["status"]) => {
    switch (status) {
      case "error":
        return "bg-red-500";
      case "complete":
        return "bg-green-500";
      default:
        return "bg-[#8B6B5D]";
    }
  };

  return (
    <div className="space-y-4">
      {/* Import Progress */}
      {isImporting && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-[#E8D5D0] p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#2C1810]">
              {progress.message}
            </span>
            <span className="text-sm text-muted-foreground">{progress.progress}%</span>
          </div>
          <Progress
            value={progress.progress}
            className="h-2"
          />
        </motion.div>
      )}

      {/* Result Summary */}
      {importResult && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-lg border p-4 ${
            importSummary.hasErrors && !importSummary.isPartial
              ? "bg-red-50 border-red-200"
              : importSummary.isPartial || importSummary.hasWarnings
              ? "bg-yellow-50 border-yellow-200"
              : "bg-green-50 border-green-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {importSummary.hasErrors && !importSummary.isPartial ? (
              <FileWarning className="w-5 h-5 text-red-600 mt-0.5" />
            ) : importSummary.isPartial || importSummary.hasWarnings ? (
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            ) : (
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-medium ${
                  importSummary.hasErrors && !importSummary.isPartial
                    ? "text-red-700"
                    : importSummary.isPartial || importSummary.hasWarnings
                    ? "text-yellow-700"
                    : "text-green-700"
                }`}
              >
                {importSummary.summaryText}
              </p>
              {importResult.totalRows !== undefined && (
                <p className="text-sm text-muted-foreground mt-1">
                  Total rows: {importResult.totalRows} | Valid: {importResult.validRows} | Invalid: {importResult.invalidRows}
                  {importResult.duplicates > 0 && ` | Duplicates: ${importResult.duplicates}`}
                </p>
              )}

              {/* Errors Accordion */}
              {importResult.errors && importResult.errors.length > 0 && (
                <Accordion type="single" collapsible className="mt-2">
                  <AccordionItem value="errors" className="border-0">
                    <AccordionTrigger className="text-red-600 text-sm py-1 hover:no-underline">
                      View {importResult.errors.length} error(s)
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm text-red-600 space-y-1 mt-2 max-h-40 overflow-y-auto">
                        {importResult.errors.slice(0, 10).map((error: string, i: number) => (
                          <li key={i}>• {error}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>... and {importResult.errors.length - 10} more</li>
                        )}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Warnings Accordion */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <Accordion type="single" collapsible className="mt-2">
                  <AccordionItem value="warnings" className="border-0">
                    <AccordionTrigger className="text-yellow-600 text-sm py-1 hover:no-underline">
                      View {importResult.warnings.length} warning(s)
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm text-yellow-600 space-y-1 mt-2 max-h-40 overflow-y-auto">
                        {importResult.warnings.slice(0, 10).map((warning: string, i: number) => (
                          <li key={i}>• {warning}</li>
                        ))}
                        {importResult.warnings.length > 10 && (
                          <li>... and {importResult.warnings.length - 10} more</li>
                        )}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {/* Duplicate Details */}
              {importResult.duplicateDetails && importResult.duplicateDetails.length > 0 && (
                <Accordion type="single" collapsible className="mt-2">
                  <AccordionItem value="duplicates" className="border-0">
                    <AccordionTrigger className="text-yellow-600 text-sm py-1 hover:no-underline">
                      View {importResult.duplicateDetails.length} potential duplicate(s)
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-sm text-yellow-600 space-y-1 mt-2 max-h-40 overflow-y-auto">
                        {importResult.duplicateDetails.map((dup: any, i: number) => (
                          <li key={i}>
                            • {dup.name}
                            {dup.email && ` (${dup.email})`}
                            {dup.phone && ` - ${dup.phone}`}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? "border-[#8B6B5D] bg-[#FDF8F5]"
                  : "border-[#E8D5D0] hover:border-[#8B6B5D]/50"
              }`}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-[#E8D5D0] to-[#FDF8F5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-[#8B6B5D]" />
              </div>
              <h3 className="text-lg font-semibold text-[#2C1810] mb-2">
                Upload CSV file
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <div className="flex items-center justify-center gap-3">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("csv-upload")?.click()}
                  className="border-[#E8D5D0]"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Select File
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloading}
                  className="text-[#8B6B5D]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Max {maxRows} rows. Supported columns: {getSupportedColumns()}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl border border-[#E8D5D0] p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-[#2C1810]">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {parseError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{parseError}</p>
              </div>
            ) : (
              <>
                {preview && preview.length > 0 && (
                  <div className="border border-[#E8D5D0] rounded-lg overflow-hidden mb-4">
                    <div className="bg-[#FDF8F5] px-4 py-2 border-b border-[#E8D5D0]">
                      <p className="text-sm font-medium text-[#2C1810]">
                        Preview (first {preview.length} rows)
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#FDF8F5]">
                          <tr>
                            {Object.keys(preview[0]).map((header) => (
                              <th
                                key={header}
                                className="px-4 py-2 text-left font-medium text-[#2C1810] whitespace-nowrap"
                              >
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, i) => (
                            <tr key={i} className="border-t border-[#E8D5D0]/50">
                              {Object.values(row).map((value: any, j) => (
                                <td
                                  key={j}
                                  className="px-4 py-2 text-muted-foreground whitespace-nowrap"
                                >
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleConfirmImport}
                    className="flex-1 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Import {type === "guests" ? "Guests" : "Clients"}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePreviewClick}
                    disabled={isProcessing}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Validate
                  </Button>
                  <Button variant="outline" onClick={handleClear} disabled={isProcessing}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>CSV Validation Results</DialogTitle>
            <DialogDescription>
              Review the validation results before importing
            </DialogDescription>
          </DialogHeader>
          {/* Validation results would be shown here from the previewCSV mutation */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
