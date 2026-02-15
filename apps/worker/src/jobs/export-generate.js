/**
 * Export Generate Job Processor
 * Features: CSV/PDF export generation, streaming, progress tracking
 */

const { pool } = require("../db");
const fs = require('fs').promises;
const path = require('path');

// Export configuration
const EXPORT_CONFIG = {
  maxRows: 100000,           // Maximum rows per export
  chunkSize: 1000,           // Process rows in chunks
  tempDir: process.env.EXPORT_TEMP_DIR || '/tmp/exports',
  formats: ['csv', 'json', 'pdf'],
  retentionHours: 24         // How long to keep exports
};

/**
 * Generate export file based on type and filters
 */
async function generateExport(data, context) {
  const {
    exportId,
    organizationId,
    type,           // 'guests', 'rsvps', 'campaigns', 'analytics'
    format,         // 'csv', 'json', 'pdf'
    filters = {},
    options = {}    // { includeFields, excludeFields, sortBy }
  } = data;

  console.log(`[export-generate] Starting ${format} export for ${type}`, { exportId });

  // Validate format
  if (!EXPORT_CONFIG.formats.includes(format)) {
    throw new Error(`Unsupported export format: ${format}. Supported: ${EXPORT_CONFIG.formats.join(', ')}`);
  }

  // Update export status to processing
  await updateExportStatus(exportId, 'processing', { startedAt: new Date().toISOString() });

  try {
    let result;

    switch (format) {
      case 'csv':
        result = await generateCSVExport(type, filters, options, exportId);
        break;
      case 'json':
        result = await generateJSONExport(type, filters, options, exportId);
        break;
      case 'pdf':
        result = await generatePDFExport(type, filters, options, exportId);
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }

    // Update export status to completed
    await updateExportStatus(exportId, 'completed', {
      completedAt: new Date().toISOString(),
      fileUrl: result.fileUrl,
      fileSize: result.fileSize,
      rowCount: result.rowCount,
      processingTime: result.processingTime
    });

    console.log(`[export-generate] Completed ${format} export`, { 
      exportId, 
      rowCount: result.rowCount,
      processingTime: result.processingTime 
    });

    return {
      status: 'completed',
      exportId,
      ...result
    };

  } catch (error) {
    console.error(`[export-generate] Export failed:`, error);
    
    await updateExportStatus(exportId, 'failed', {
      failedAt: new Date().toISOString(),
      error: error.message
    });

    throw error;
  }
}

/**
 * Generate CSV export
 */
async function generateCSVExport(type, filters, options, exportId) {
  const startTime = Date.now();
  const filename = `export-${exportId}.csv`;
  const filepath = path.join(EXPORT_CONFIG.tempDir, filename);

  // Ensure temp directory exists
  await fs.mkdir(EXPORT_CONFIG.tempDir, { recursive: true });

  // Get data and headers
  const { query, params, headers } = buildExportQuery(type, filters, options);

  // Stream results to file
  const writeStream = await fs.open(filepath, 'w');
  
  // Write CSV header
  await writeStream.write(headers.join(',') + '\n');

  let rowCount = 0;
  let offset = 0;
  let hasMore = true;

  while (hasMore && rowCount < EXPORT_CONFIG.maxRows) {
    const chunkQuery = `${query} LIMIT ${EXPORT_CONFIG.chunkSize} OFFSET ${offset}`;
    const result = await pool?.query(chunkQuery, params);

    if (!result || result.rowCount === 0) {
      hasMore = false;
      break;
    }

    for (const row of result.rows) {
      const csvRow = headers.map(h => {
        const value = row[h] ?? '';
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
      
      await writeStream.write(csvRow + '\n');
    }

    rowCount += result.rowCount;
    offset += EXPORT_CONFIG.chunkSize;

    // Update progress
    await updateExportProgress(exportId, rowCount);
  }

  await writeStream.close();

  // Get file stats
  const stats = await fs.stat(filepath);

  return {
    fileUrl: `/exports/${filename}`,
    filePath: filepath,
    fileSize: stats.size,
    rowCount,
    processingTime: Date.now() - startTime,
    format: 'csv'
  };
}

/**
 * Generate JSON export
 */
async function generateJSONExport(type, filters, options, exportId) {
  const startTime = Date.now();
  const filename = `export-${exportId}.json`;
  const filepath = path.join(EXPORT_CONFIG.tempDir, filename);

  await fs.mkdir(EXPORT_CONFIG.tempDir, { recursive: true });

  const { query, params } = buildExportQuery(type, filters, options);

  const writeStream = await fs.open(filepath, 'w');
  await writeStream.write('[');

  let rowCount = 0;
  let offset = 0;
  let hasMore = true;
  let firstRow = true;

  while (hasMore && rowCount < EXPORT_CONFIG.maxRows) {
    const chunkQuery = `${query} LIMIT ${EXPORT_CONFIG.chunkSize} OFFSET ${offset}`;
    const result = await pool?.query(chunkQuery, params);

    if (!result || result.rowCount === 0) {
      hasMore = false;
      break;
    }

    for (const row of result.rows) {
      if (!firstRow) {
        await writeStream.write(',');
      }
      await writeStream.write('\n' + JSON.stringify(row));
      firstRow = false;
    }

    rowCount += result.rowCount;
    offset += EXPORT_CONFIG.chunkSize;
    await updateExportProgress(exportId, rowCount);
  }

  await writeStream.write('\n]');
  await writeStream.close();

  const stats = await fs.stat(filepath);

  return {
    fileUrl: `/exports/${filename}`,
    filePath: filepath,
    fileSize: stats.size,
    rowCount,
    processingTime: Date.now() - startTime,
    format: 'json'
  };
}

/**
 * Generate PDF export (placeholder - would use library like Puppeteer or PDFKit)
 */
async function generatePDFExport(type, filters, options, exportId) {
  const startTime = Date.now();
  const filename = `export-${exportId}.pdf`;
  const filepath = path.join(EXPORT_CONFIG.tempDir, filename);

  await fs.mkdir(EXPORT_CONFIG.tempDir, { recursive: true });

  // Get data
  const { query, params } = buildExportQuery(type, filters, options);
  const result = await pool?.query(`${query} LIMIT ${EXPORT_CONFIG.maxRows}`, params);
  
  const rowCount = result?.rowCount || 0;

  // Placeholder: In production, use PDFKit or Puppeteer
  // For now, create a simple text representation
  const content = `
EXPORT REPORT
=============
Type: ${type}
Generated: ${new Date().toISOString()}
Rows: ${rowCount}
Filters: ${JSON.stringify(filters, null, 2)}

DATA PREVIEW:
${JSON.stringify(result?.rows.slice(0, 10), null, 2)}
`;

  await fs.writeFile(filepath.replace('.pdf', '.txt'), content);

  // Create empty PDF placeholder
  await fs.writeFile(filepath, '%PDF-1.4 placeholder');

  const stats = await fs.stat(filepath);

  return {
    fileUrl: `/exports/${filename}`,
    filePath: filepath,
    fileSize: stats.size,
    rowCount,
    processingTime: Date.now() - startTime,
    format: 'pdf',
    note: 'PDF generation requires PDFKit or Puppeteer installation'
  };
}

/**
 * Build export query based on type
 */
function buildExportQuery(type, filters, options) {
  let query;
  let params = [];
  let headers = [];

  switch (type) {
    case 'guests':
      query = `SELECT 
        g.id, g.first_name, g.last_name, g.email, g.phone,
        g.status, g.tags, g.notes, g.created_at, g.updated_at,
        e.name as event_name
      FROM guests g
      LEFT JOIN events e ON g.event_id = e.id
      WHERE 1=1`;
      
      if (filters.organizationId) {
        query += ` AND g.organization_id = $${params.length + 1}`;
        params.push(filters.organizationId);
      }
      if (filters.eventId) {
        query += ` AND g.event_id = $${params.length + 1}`;
        params.push(filters.eventId);
      }
      if (filters.status) {
        query += ` AND g.status = $${params.length + 1}`;
        params.push(filters.status);
      }
      
      headers = ['id', 'first_name', 'last_name', 'email', 'phone', 'status', 'tags', 'notes', 'created_at', 'updated_at', 'event_name'];
      break;

    case 'rsvps':
      query = `SELECT 
        r.id, r.status as rsvp_status, r.guest_count, r.dietary_requirements,
        g.first_name, g.last_name, g.email,
        e.name as event_name,
        r.created_at, r.updated_at
      FROM rsvps r
      JOIN guests g ON r.guest_id = g.id
      JOIN events e ON r.event_id = e.id
      WHERE 1=1`;
      
      if (filters.eventId) {
        query += ` AND r.event_id = $${params.length + 1}`;
        params.push(filters.eventId);
      }
      if (filters.status) {
        query += ` AND r.status = $${params.length + 1}`;
        params.push(filters.status);
      }
      
      headers = ['id', 'rsvp_status', 'guest_count', 'dietary_requirements', 'first_name', 'last_name', 'email', 'event_name', 'created_at', 'updated_at'];
      break;

    case 'campaigns':
      query = `SELECT 
        mc.id, mc.name, mc.subject, mc.status,
        mc.scheduled_at, mc.sent_at,
        COUNT(mj.id) as total_messages,
        COUNT(CASE WHEN mj.status = 'SENT' THEN 1 END) as sent_count,
        COUNT(CASE WHEN mj.status = 'FAILED' THEN 1 END) as failed_count,
        mc.created_at
      FROM messaging_campaigns mc
      LEFT JOIN message_jobs mj ON mj.campaign_id = mc.id
      WHERE 1=1`;
      
      if (filters.organizationId) {
        query += ` AND mc.organization_id = $${params.length + 1}`;
        params.push(filters.organizationId);
      }
      
      query += ` GROUP BY mc.id`;
      
      headers = ['id', 'name', 'subject', 'status', 'scheduled_at', 'sent_at', 'total_messages', 'sent_count', 'failed_count', 'created_at'];
      break;

    case 'analytics':
      query = `SELECT 
        DATE(me.created_at) as date,
        me.event_type,
        COUNT(*) as count,
        mc.name as campaign_name
      FROM message_events me
      JOIN message_jobs mj ON me.message_job_id = mj.id
      JOIN messaging_campaigns mc ON mj.campaign_id = mc.id
      WHERE 1=1`;
      
      if (filters.organizationId) {
        query += ` AND mc.organization_id = $${params.length + 1}`;
        params.push(filters.organizationId);
      }
      if (filters.dateFrom) {
        query += ` AND me.created_at >= $${params.length + 1}`;
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        query += ` AND me.created_at <= $${params.length + 1}`;
        params.push(filters.dateTo);
      }
      
      query += ` GROUP BY DATE(me.created_at), me.event_type, mc.name ORDER BY date DESC`;
      
      headers = ['date', 'event_type', 'count', 'campaign_name'];
      break;

    default:
      throw new Error(`Unknown export type: ${type}`);
  }

  // Add sorting
  if (options.sortBy) {
    query += ` ORDER BY ${options.sortBy}`;
  }

  return { query, params, headers };
}

/**
 * Update export status in database
 */
async function updateExportStatus(exportId, status, metadata = {}) {
  if (!pool) return;

  await pool.query(
    `INSERT INTO exports (id, status, metadata, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET
       status = EXCLUDED.status,
       metadata = exports.metadata || EXCLUDED.metadata,
       updated_at = NOW()`,
    [exportId, status, JSON.stringify(metadata)]
  );
}

/**
 * Update export progress
 */
async function updateExportProgress(exportId, rowCount) {
  if (!pool || rowCount % 1000 !== 0) return; // Update every 1000 rows

  await pool.query(
    `UPDATE exports 
     SET metadata = metadata || jsonb_build_object('rowCount', $2, 'progressAt', NOW())
     WHERE id = $1`,
    [exportId, rowCount]
  );
}

/**
 * Cleanup old export files
 */
async function cleanupOldExports() {
  try {
    const files = await fs.readdir(EXPORT_CONFIG.tempDir);
    const now = Date.now();
    const maxAge = EXPORT_CONFIG.retentionHours * 3600000;

    for (const file of files) {
      const filepath = path.join(EXPORT_CONFIG.tempDir, file);
      const stats = await fs.stat(filepath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filepath);
        console.log(`[export-generate] Cleaned up old export: ${file}`);
      }
    }
  } catch (error) {
    console.error('[export-generate] Cleanup failed:', error);
  }
}

module.exports = {
  generateExport,
  generateCSVExport,
  generateJSONExport,
  generatePDFExport,
  cleanupOldExports,
  EXPORT_CONFIG
};
