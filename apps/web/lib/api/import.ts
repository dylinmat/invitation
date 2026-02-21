/**
 * Import API Client
 * CSV import operations for guests and clients
 */

import { api } from "../api";

// ====================
// Types
// ====================

export interface ImportResult {
  success: boolean;
  imported: number;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
  duplicates?: number;
  errors: string[];
  warnings: string[];
  duplicateDetails?: DuplicateRecord[];
  failedRows?: FailedRow[];
  error?: string;
}

export interface DuplicateRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface FailedRow {
  row: Record<string, string>;
  rowNumber: number;
  errors: string[];
}

export interface PreviewResult {
  success: boolean;
  preview?: Record<string, string>[];
  totalRows?: number;
  headers?: string[];
  validation?: {
    headers: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
    rows: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
  };
  error?: string;
}

export interface TemplateContent {
  success: boolean;
  headers?: string[];
  exampleRows?: Record<string, string>[];
  error?: string;
}

export type ImportType = "guests" | "clients";

export interface ImportOptions {
  skipDuplicates?: boolean;
  skipValidation?: boolean;
}

// ====================
// Import API
// ====================

/**
 * Import CSV file for guests or clients
 * @param file - CSV file to import
 * @param type - Import type ('guests' or 'clients')
 * @param contextId - Project ID for guests, Organization ID for clients
 * @param options - Import options
 * @returns Promise with import result
 */
export async function importCSV(
  file: File,
  type: ImportType,
  contextId: string,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  // Add context ID based on type
  if (type === "guests") {
    formData.append("projectId", contextId);
  } else {
    formData.append("organizationId", contextId);
  }

  // Add options
  if (options.skipDuplicates) {
    formData.append("skipDuplicates", "true");
  }
  if (options.skipValidation) {
    formData.append("skipValidation", "true");
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/import/csv`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Import failed");
  }

  return data;
}

/**
 * Preview CSV data without importing
 * @param file - CSV file to preview
 * @param type - Import type ('guests' or 'clients')
 * @returns Promise with preview result
 */
export async function previewCSV(file: File, type: ImportType): Promise<PreviewResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/import/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
    body: formData,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || "Preview failed");
  }

  return data;
}

/**
 * Download CSV template
 * @param type - Template type ('guests' or 'clients')
 * @returns Promise that resolves when download starts
 */
export async function downloadTemplate(type: ImportType): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/import/template/${type}`,
    {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    }
  );

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to download template");
  }

  // Create blob and download
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = type === "guests" ? "guests_template.csv" : "clients_template.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Get CSV template content for display
 * @param type - Template type ('guests' or 'clients')
 * @returns Promise with template content
 */
export async function getTemplateContent(type: ImportType): Promise<TemplateContent> {
  return api.get<TemplateContent>(`/import/template-content/${type}`);
}

/**
 * Parse CSV file locally for preview
 * @param file - CSV file to parse
 * @returns Promise with parsed rows
 */
export function parseCSVFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSVText(text);
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
    
    reader.readAsText(file);
  });
}

// ====================
// Helper Functions
// ====================

/**
 * Parse CSV text into array of objects
 * Handles quoted fields and commas within fields
 */
function parseCSVText(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;
  
  // Parse character by character to handle quoted fields
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === '\n' || char === '\r') {
      if (insideQuotes) {
        currentLine += char;
      } else {
        if (currentLine.trim() !== "") {
          lines.push(currentLine);
        }
        currentLine = "";
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      }
    } else {
      currentLine += char;
    }
  }
  
  if (currentLine.trim() !== "") {
    lines.push(currentLine);
  }
  
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }
  
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] !== undefined ? values[index].trim() : "";
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parse a single CSV line
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = "";
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }
  
  values.push(currentValue);
  return values;
}

/**
 * Get auth token from storage
 */
function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("eios_token") || "";
}

// ====================
// Import API Object
// ====================

export const importApi = {
  importCSV,
  previewCSV,
  downloadTemplate,
  getTemplateContent,
  parseCSVFile,
};

export default importApi;
