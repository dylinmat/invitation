// =====================
// CSV Validation
// =====================

/**
 * Required and optional headers for guest CSV
 */
const GUEST_HEADERS = {
  required: ["name"],
  optional: ["email", "phone", "dietary_restrictions", "plus_one", "table_number", "group", "role"]
};

/**
 * Required and optional headers for client CSV
 */
const CLIENT_HEADERS = {
  required: ["name"],
  optional: ["email", "phone", "type", "notes", "status", "address", "company"]
};

/**
 * Validate CSV headers
 * @param {Array} headers - Array of header strings from CSV
 * @param {string} type - 'guests' or 'clients'
 * @returns {Object} Validation result with errors array
 */
const validateHeaders = (headers, type) => {
  const errors = [];
  const warnings = [];
  
  if (!headers || headers.length === 0) {
    return {
      valid: false,
      errors: ["No headers found in CSV file"],
      warnings: []
    };
  }
  
  // Normalize headers to lowercase and trim
  const normalizedHeaders = headers.map(h => (h || "").toString().toLowerCase().trim());
  
  const config = type === "guests" ? GUEST_HEADERS : CLIENT_HEADERS;
  
  // Check for required headers
  const missingRequired = config.required.filter(
    required => !normalizedHeaders.includes(required.toLowerCase())
  );
  
  if (missingRequired.length > 0) {
    errors.push(`Missing required headers: ${missingRequired.join(", ")}`);
  }
  
  // Check for unknown headers (potential typos)
  const allValidHeaders = [...config.required, ...config.optional].map(h => h.toLowerCase());
  const unknownHeaders = normalizedHeaders.filter(
    header => !allValidHeaders.includes(header) && header !== ""
  );
  
  if (unknownHeaders.length > 0) {
    warnings.push(`Unknown headers found: ${unknownHeaders.join(", ")}. These will be ignored.`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate a single guest row
 * @param {Object} row - CSV row object
 * @param {number} rowNumber - Row number for error reporting
 * @returns {Object} Validation result
 */
const validateGuestRow = (row, rowNumber) => {
  const errors = [];
  const warnings = [];
  
  // Check required field: name
  if (!row.name || row.name.toString().trim() === "") {
    errors.push(`Row ${rowNumber}: Name is required`);
  } else if (row.name.toString().trim().length < 2) {
    errors.push(`Row ${rowNumber}: Name must be at least 2 characters`);
  }
  
  // Validate email format if provided
  if (row.email && row.email.toString().trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.toString().trim())) {
      errors.push(`Row ${rowNumber}: Invalid email format: ${row.email}`);
    }
  }
  
  // Validate phone format if provided (basic validation)
  if (row.phone && row.phone.toString().trim() !== "") {
    const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
    if (!phoneRegex.test(row.phone.toString().trim())) {
      warnings.push(`Row ${rowNumber}: Phone number may be invalid: ${row.phone}`);
    }
  }
  
  // Validate plus_one value
  if (row.plus_one !== undefined && row.plus_one !== "") {
    const validPlusOneValues = ["true", "false", "yes", "no", "1", "0", ""];
    const normalizedValue = row.plus_one.toString().toLowerCase().trim();
    if (!validPlusOneValues.includes(normalizedValue)) {
      warnings.push(`Row ${rowNumber}: plus_one value "${row.plus_one}" should be "true", "false", "yes", or "no"`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate a single client row
 * @param {Object} row - CSV row object
 * @param {number} rowNumber - Row number for error reporting
 * @returns {Object} Validation result
 */
const validateClientRow = (row, rowNumber) => {
  const errors = [];
  const warnings = [];
  
  // Check required field: name
  if (!row.name || row.name.toString().trim() === "") {
    errors.push(`Row ${rowNumber}: Name is required`);
  } else if (row.name.toString().trim().length < 2) {
    errors.push(`Row ${rowNumber}: Name must be at least 2 characters`);
  }
  
  // Validate email format if provided
  if (row.email && row.email.toString().trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email.toString().trim())) {
      errors.push(`Row ${rowNumber}: Invalid email format: ${row.email}`);
    }
  }
  
  // Validate phone format if provided
  if (row.phone && row.phone.toString().trim() !== "") {
    const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
    if (!phoneRegex.test(row.phone.toString().trim())) {
      warnings.push(`Row ${rowNumber}: Phone number may be invalid: ${row.phone}`);
    }
  }
  
  // Validate type value
  if (row.type && row.type.toString().trim() !== "") {
    const validTypes = ["couple", "corporate", "individual", "vendor", "venue"];
    const normalizedType = row.type.toString().toLowerCase().trim();
    if (!validTypes.includes(normalizedType)) {
      warnings.push(`Row ${rowNumber}: Unknown client type "${row.type}". Valid types: ${validTypes.join(", ")}`);
    }
  }
  
  // Validate status value
  if (row.status && row.status.toString().trim() !== "") {
    const validStatuses = ["active", "inactive", "archived", "prospect", "lead"];
    const normalizedStatus = row.status.toString().toLowerCase().trim();
    if (!validStatuses.includes(normalizedStatus)) {
      warnings.push(`Row ${rowNumber}: Unknown status "${row.status}". Valid statuses: ${validStatuses.join(", ")}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate all rows in the CSV
 * @param {Array} rows - Array of row objects
 * @param {string} type - 'guests' or 'clients'
 * @returns {Object} Validation result with errors and valid rows
 */
const validateRows = (rows, type) => {
  const allErrors = [];
  const allWarnings = [];
  const validRows = [];
  const invalidRows = [];
  
  if (!rows || rows.length === 0) {
    return {
      valid: false,
      errors: ["No data rows found in CSV file"],
      warnings: [],
      validRows: [],
      invalidRows: []
    };
  }
  
  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because row 1 is headers and we're 0-indexed
    
    // Normalize row keys to lowercase
    const normalizedRow = {};
    Object.keys(row).forEach(key => {
      normalizedRow[key.toLowerCase().trim()] = row[key];
    });
    
    const result = type === "guests" 
      ? validateGuestRow(normalizedRow, rowNumber)
      : validateClientRow(normalizedRow, rowNumber);
    
    if (result.valid) {
      validRows.push({
        ...normalizedRow,
        _rowNumber: rowNumber
      });
    } else {
      invalidRows.push({
        row: normalizedRow,
        rowNumber,
        errors: result.errors
      });
    }
    
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    validRows,
    invalidRows
  };
};

/**
 * Get CSV template for download
 * @param {string} type - 'guests' or 'clients'
 * @returns {string} CSV template content
 */
const getCSVTemplate = (type) => {
  if (type === "guests") {
    return `name,email,phone,dietary_restrictions,plus_one,table_number
John Doe,john@example.com,555-1234,Vegetarian,true,1
Jane Smith,jane@example.com,555-5678,None,false,1
Bob Johnson,bob@example.com,555-9999,Gluten Free,true,2`;
  } else {
    return `name,email,phone,type,notes,status
Acme Corp,contact@acme.com,555-9999,corporate,Annual event client,active
Smith Wedding,smith@email.com,555-1111,couple,June wedding,active
John Individual,john@email.com,555-2222,individual,Referral from Jane,prospect`;
  }
};

module.exports = {
  validateHeaders,
  validateRows,
  validateGuestRow,
  validateClientRow,
  getCSVTemplate,
  GUEST_HEADERS,
  CLIENT_HEADERS
};
