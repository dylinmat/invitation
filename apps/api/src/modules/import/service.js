const { 
  validateHeaders, 
  validateRows, 
  getCSVTemplate 
} = require("./validation");

const {
  insertGuestsBatch,
  insertClientsBatch,
  checkExistingGuests,
  checkExistingClients
} = require("./repository");

// =====================
// CSV Parsing
// =====================

/**
 * Parse CSV content into rows
 * Handles quoted fields, commas within fields, and newlines
 * @param {string} content - CSV file content
 * @returns {Array} Array of row objects
 */
const parseCSV = (content) => {
  if (!content || content.trim() === "") {
    throw new Error("CSV content is empty");
  }
  
  const lines = [];
  let currentLine = "";
  let insideQuotes = false;
  
  // Parse character by character to handle quoted fields
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentLine += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === '\n' || char === '\r') {
      if (insideQuotes) {
        // Newline inside quotes - keep it
        currentLine += char;
      } else {
        // End of line
        if (currentLine.trim() !== "") {
          lines.push(currentLine);
        }
        currentLine = "";
        // Handle \r\n (Windows line endings)
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      }
    } else {
      currentLine += char;
    }
  }
  
  // Don't forget the last line
  if (currentLine.trim() !== "") {
    lines.push(currentLine);
  }
  
  if (lines.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }
  
  // Parse headers
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] !== undefined ? values[index].trim() : "";
    });
    rows.push(row);
  }
  
  return { headers, rows };
};

/**
 * Parse a single CSV line into array of values
 * Handles quoted fields properly
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
const parseCSVLine = (line) => {
  const values = [];
  let currentValue = "";
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
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
  
  // Don't forget the last value
  values.push(currentValue);
  
  return values;
};

// =====================
// Import Operations
// =====================

/**
 * Preview CSV data without importing
 * @param {Buffer} fileBuffer - CSV file buffer
 * @param {string} type - 'guests' or 'clients'
 * @returns {Object} Preview result with first 5 rows and validation info
 */
const previewCSV = async (fileBuffer, type) => {
  try {
    const content = fileBuffer.toString("utf-8");
    const { headers, rows } = parseCSV(content);
    
    // Validate headers
    const headerValidation = validateHeaders(headers, type);
    
    // Validate first 5 rows for preview
    const previewRows = rows.slice(0, 5);
    const previewValidation = validateRows(previewRows, type);
    
    return {
      success: true,
      preview: previewRows,
      totalRows: rows.length,
      headers,
      validation: {
        headers: headerValidation,
        rows: {
          valid: previewValidation.valid,
          errors: previewValidation.errors,
          warnings: previewValidation.warnings
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Import guests from CSV
 * @param {string} projectId - Project ID
 * @param {Buffer} fileBuffer - CSV file buffer
 * @param {Object} options - Import options
 * @returns {Object} Import result
 */
const importGuests = async (projectId, fileBuffer, options = {}) => {
  const { skipValidation = false, skipDuplicates = false } = options;
  
  try {
    // Parse CSV
    const content = fileBuffer.toString("utf-8");
    const { headers, rows } = parseCSV(content);
    
    // Validate headers
    const headerValidation = validateHeaders(headers, "guests");
    if (!headerValidation.valid) {
      return {
        success: false,
        imported: 0,
        errors: headerValidation.errors,
        warnings: headerValidation.warnings
      };
    }
    
    // Validate rows
    const rowValidation = validateRows(rows, "guests");
    
    if (!skipValidation && !rowValidation.valid && rowValidation.validRows.length === 0) {
      return {
        success: false,
        imported: 0,
        errors: rowValidation.errors,
        warnings: rowValidation.warnings,
        invalidRows: rowValidation.invalidRows
      };
    }
    
    // Check for duplicates if requested
    let duplicates = [];
    let warnings = [...rowValidation.warnings];
    
    if (!skipDuplicates) {
      duplicates = await checkExistingGuests(projectId, rowValidation.validRows);
      if (duplicates.length > 0) {
        warnings.push(`Found ${duplicates.length} potential duplicate(s) by email/phone`);
      }
    }
    
    // Import valid rows
    const rowsToImport = rowValidation.validRows.map(row => ({
      name: row.name,
      email: row.email,
      phone: row.phone,
      dietary_restrictions: row.dietary_restrictions,
      plus_one: row.plus_one,
      table_number: row.table_number,
      group: row.group,
      role: row.role
    }));
    
    const insertedIds = await insertGuestsBatch(projectId, rowsToImport);
    
    return {
      success: true,
      imported: insertedIds.length,
      totalRows: rows.length,
      validRows: rowValidation.validRows.length,
      invalidRows: rowValidation.invalidRows.length,
      duplicates: duplicates.length,
      errors: rowValidation.errors,
      warnings,
      duplicateDetails: duplicates,
      failedRows: rowValidation.invalidRows
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      errors: [error.message],
      warnings: []
    };
  }
};

/**
 * Import clients from CSV
 * @param {string} organizationId - Organization ID
 * @param {Buffer} fileBuffer - CSV file buffer
 * @param {Object} options - Import options
 * @returns {Object} Import result
 */
const importClients = async (organizationId, fileBuffer, options = {}) => {
  const { skipValidation = false, skipDuplicates = false } = options;
  
  try {
    // Parse CSV
    const content = fileBuffer.toString("utf-8");
    const { headers, rows } = parseCSV(content);
    
    // Validate headers
    const headerValidation = validateHeaders(headers, "clients");
    if (!headerValidation.valid) {
      return {
        success: false,
        imported: 0,
        errors: headerValidation.errors,
        warnings: headerValidation.warnings
      };
    }
    
    // Validate rows
    const rowValidation = validateRows(rows, "clients");
    
    if (!skipValidation && !rowValidation.valid && rowValidation.validRows.length === 0) {
      return {
        success: false,
        imported: 0,
        errors: rowValidation.errors,
        warnings: rowValidation.warnings,
        invalidRows: rowValidation.invalidRows
      };
    }
    
    // Check for duplicates if requested
    let duplicates = [];
    let warnings = [...rowValidation.warnings];
    
    if (!skipDuplicates) {
      duplicates = await checkExistingClients(organizationId, rowValidation.validRows);
      if (duplicates.length > 0) {
        warnings.push(`Found ${duplicates.length} potential duplicate(s) by email/phone`);
      }
    }
    
    // Import valid rows
    const rowsToImport = rowValidation.validRows.map(row => ({
      name: row.name,
      email: row.email,
      phone: row.phone,
      type: row.type,
      notes: row.notes,
      status: row.status,
      address: row.address || row.company
    }));
    
    const insertedIds = await insertClientsBatch(organizationId, rowsToImport);
    
    return {
      success: true,
      imported: insertedIds.length,
      totalRows: rows.length,
      validRows: rowValidation.validRows.length,
      invalidRows: rowValidation.invalidRows.length,
      duplicates: duplicates.length,
      errors: rowValidation.errors,
      warnings,
      duplicateDetails: duplicates,
      failedRows: rowValidation.invalidRows
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      errors: [error.message],
      warnings: []
    };
  }
};

/**
 * Get CSV template for download
 * @param {string} type - 'guests' or 'clients'
 * @returns {string} CSV template content
 */
const getTemplate = (type) => {
  return getCSVTemplate(type);
};

module.exports = {
  parseCSV,
  previewCSV,
  importGuests,
  importClients,
  getTemplate
};
