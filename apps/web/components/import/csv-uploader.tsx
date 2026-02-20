"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, Check, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toaster";

interface CsvUploaderProps {
  onUpload: (data: any[]) => void;
  maxRows?: number;
}

export function CsvUploader({ onUpload, maxRows = 1000 }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) throw new Error("CSV must have header and at least one data row");

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: any[] = [];

    for (let i = 1; i < lines.length && i <= maxRows + 1; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }

    return rows;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      processFile(droppedFile);
    } else {
      setError("Please upload a CSV file");
      showToast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  }, []);

  const processFile = (file: File) => {
    setFile(file);
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        setPreview(data.slice(0, 5)); // Show first 5 rows
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV");
        setIsLoading(false);
        showToast({
          title: "Parse error",
          description: err instanceof Error ? err.message : "Failed to parse CSV",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (preview) {
      onUpload(preview);
      setFile(null);
      setPreview(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
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
              <p className="text-xs text-muted-foreground mt-4">
                Max {maxRows} rows. Supported columns: name, email, phone, plus_ones
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
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            ) : (
              <>
                <div className="border border-[#E8D5D0] rounded-lg overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FDF8F5]">
                      <tr>
                        {preview &&
                          Object.keys(preview[0]).map((header) => (
                            <th
                              key={header}
                              className="px-4 py-2 text-left font-medium text-[#2C1810]"
                            >
                              {header}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview?.map((row, i) => (
                        <tr key={i} className="border-t border-[#E8D5D0]/50">
                          {Object.values(row).map((value: any, j) => (
                            <td key={j} className="px-4 py-2 text-muted-foreground">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleConfirm}
                    className="flex-1 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Import {preview?.length}+ Guests
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleClear}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
