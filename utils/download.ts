import JSZip from 'jszip';

/**
 * @fileoverview File download utility functions.
 *
 * Provides shared utilities for triggering file downloads in the browser.
 *
 * @module utils/download
 * @category Utilities
 */

/**
 * Triggers a file download in the browser.
 *
 * Creates a temporary anchor element, sets up a blob URL, and triggers
 * a click to download the file. Properly cleans up the blob URL after download.
 *
 * @function downloadFile
 * @param {string} content - The content to include in the file.
 * @param {string} fileName - The name for the downloaded file (including extension).
 * @param {string} contentType - The MIME type of the file (e.g., 'application/json', 'text/csv').
 *
 * @example
 * // Download JSON file
 * downloadFile(JSON.stringify(data, null, 2), 'data.json', 'application/json');
 *
 * @example
 * // Download SQL file
 * downloadFile(sqlContent, 'schema.sql', 'application/sql');
 *
 * @example
 * // Download CSV file
 * downloadFile(csvContent, 'export.csv', 'text/csv');
 */
export function downloadFile(content: string, fileName: string, contentType: string): void {
  const anchor = document.createElement('a');
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();

  // Clean up the blob URL to free memory
  URL.revokeObjectURL(url);
}

/**
 * Converts a single table from JSON to CSV format.
 *
 * @function tableToCsv
 * @param {any[]} tableData - Array of row objects.
 * @returns {string} CSV formatted string.
 */
function tableToCsv(tableData: any[]): string {
  if (tableData.length === 0) return '';
  const headers = Object.keys(tableData[0]);
  const csvRows = [headers.join(',')];

  for (const row of tableData) {
    const values = headers.map(header => {
      const val = row[header];
      const stringVal = val === null || val === undefined ? '' : String(val);
      // Escape quotes by doubling them
      const escaped = stringVal.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

/**
 * Converts JSON data with multiple tables to a ZIP of CSV files.
 *
 * @function downloadAllAsCsv
 * @param {string} jsonData - JSON string containing table data, where keys are table names.
 * @param {string} zipFileName - The name for the downloaded ZIP file.
 */
export async function downloadAllAsCsv(jsonData: string, zipFileName: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }

    const zip = new JSZip();

    for (const tableName in data) {
      if (Object.prototype.hasOwnProperty.call(data, tableName) && Array.isArray(data[tableName])) {
        const csvContent = tableToCsv(data[tableName]);
        if (csvContent) {
          zip.file(`${tableName}.csv`, csvContent);
        }
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = zipFileName;
    anchor.click();

    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Error creating CSV zip file:', e);
    // You might want to dispatch a toast notification here to inform the user
  }
}

/**
 * Converts JSON data to CSV format.
 *
 * Expects JSON with table data where keys are table names and values are arrays
 * of row objects. Converts the first table found to CSV format.
 *
 * @function jsonToCsv
 * @param {string} jsonData - JSON string containing table data.
 * @returns {string} CSV formatted string, or error message if conversion fails.
 *
 * @example
 * const json = JSON.stringify({ Users: [{ id: 1, name: 'John' }] });
 * const csv = jsonToCsv(json);
 * // Returns: "id,name\n\"1\",\"John\""
 */
export function jsonToCsv(jsonData: string): string {
  try {
    const data = JSON.parse(jsonData);
    if (!data || typeof data !== 'object') return 'Invalid data format';

    // Find the first array property which likely contains the table data
    const tableKey = Object.keys(data).find(key => Array.isArray(data[key]));

    if (!tableKey) return 'No table data found to convert.';

    const tableData = data[tableKey];
    if (tableData.length === 0) return 'Table is empty.';

    return tableToCsv(tableData);
  } catch (e) {
    console.error('Error converting JSON to CSV:', e);
    return 'Error converting data to CSV.';
  }
}
