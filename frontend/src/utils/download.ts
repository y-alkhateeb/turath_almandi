/**
 * Download and export utility functions
 * Browser-compatible file download and print helpers
 */

import ExcelJS from 'exceljs';

/**
 * Download blob as file
 * Triggers browser file download for any Blob
 *
 * @param blob - Blob to download
 * @param filename - Filename for download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // Create object URL from blob
  const url = window.URL.createObjectURL(blob);

  // Create temporary anchor element
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Download text content as file
 * @param content - Text content to download
 * @param filename - Filename for download
 * @param mimeType - MIME type (default: 'text/plain')
 */
export function downloadText(
  content: string,
  filename: string,
  mimeType: string = 'text/plain',
): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

/**
 * Download JSON data as file
 * @param data - Data to serialize and download
 * @param filename - Filename for download (should end with .json)
 */
export function downloadJson<T = unknown>(data: T, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadText(json, filename, 'application/json');
}

/**
 * Download CSV data
 * Converts array of objects to CSV and downloads
 *
 * @param data - Array of objects to convert to CSV
 * @param filename - Filename for download (should end with .csv)
 */
export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
): void {
  if (data.length === 0) {
    console.warn('No data to export to CSV');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV header row
  const csvHeader = headers.join(',');

  // Create CSV data rows
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [csvHeader, ...csvRows].join('\n');

  // Add BOM for proper UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  downloadText(BOM + csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Download data as Excel file using ExcelJS
 * Creates formatted Excel workbook with proper styling
 *
 * @param data - Array of objects or object with sheet names as keys
 * @param filename - Filename for download (should end with .xlsx)
 * @param options - Optional configuration
 */
export async function downloadExcel<T extends Record<string, unknown>>(
  data: T[] | Record<string, T[]>,
  filename: string,
  options?: {
    sheetName?: string;
    headerStyle?: Partial<ExcelJS.Style>;
    cellStyle?: Partial<ExcelJS.Style>;
    autoWidth?: boolean;
  },
): Promise<void> {
  // Default options
  const opts = {
    sheetName: 'Sheet1',
    autoWidth: true,
    headerStyle: {
      font: { bold: true, size: 12 },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF4472C4' },
      },
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
    },
    cellStyle: {
      alignment: { vertical: 'middle' as const, horizontal: 'right' as const },
    },
    ...options,
  };

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Turath Almandi';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastModifiedBy = 'Turath Almandi';

  // Handle multiple sheets or single sheet
  const sheets: Record<string, T[]> = Array.isArray(data)
    ? { [opts.sheetName]: data }
    : data;

  // Create each sheet
  Object.entries(sheets).forEach(([sheetName, sheetData]) => {
    if (sheetData.length === 0) {
      console.warn(`No data for sheet: ${sheetName}`);
      return;
    }

    // Add worksheet
    const worksheet = workbook.addWorksheet(sheetName, {
      properties: { defaultRowHeight: 20 },
      views: [{ rightToLeft: true }], // RTL for Arabic
    });

    // Get headers from first object
    const headers = Object.keys(sheetData[0]);

    // Add header row
    const headerRow = worksheet.addRow(headers);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.style = opts.headerStyle;
    });

    // Add data rows
    sheetData.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        // Handle null/undefined
        if (value === null || value === undefined) return '';
        // Handle dates
        if (value instanceof Date) return value;
        // Handle numbers
        if (typeof value === 'number') return value;
        // Convert to string
        return String(value);
      });

      const dataRow = worksheet.addRow(values);
      dataRow.eachCell((cell) => {
        cell.style = opts.cellStyle;
      });
    });

    // Auto-size columns if enabled
    if (opts.autoWidth) {
      worksheet.columns.forEach((column, index) => {
        const header = headers[index];
        let maxLength = header.length;

        // Check data rows for max length
        sheetData.forEach((row) => {
          const value = row[header];
          const cellLength = value ? String(value).length : 0;
          maxLength = Math.max(maxLength, cellLength);
        });

        // Set column width (with min/max limits)
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });
    }

    // Freeze header row
    worksheet.views = [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: 1,
        rightToLeft: true,
      },
    ];
  });

  // Generate Excel file as blob
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Ensure filename has .xlsx extension
  const xlsxFilename = ensureFileExtension(filename, 'xlsx');

  // Download
  downloadBlob(blob, xlsxFilename);
}

/**
 * Download data URL as file
 * @param dataUrl - Data URL (data:image/png;base64,...)
 * @param filename - Filename for download
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert canvas to blob and download
 * @param canvas - HTML Canvas element
 * @param filename - Filename for download
 * @param mimeType - Image MIME type (default: 'image/png')
 */
export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
  mimeType: string = 'image/png',
): void {
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, filename);
    } else {
      console.error('Failed to convert canvas to blob');
    }
  }, mimeType);
}

/**
 * Print HTML element
 * Opens print dialog with element contents
 *
 * Browser compatibility:
 * - Creates hidden iframe
 * - Copies element styles
 * - Triggers print dialog
 * - Cleans up after print/cancel
 *
 * @param element - HTML element to print
 * @param title - Optional document title for print
 */
export function printReport(element: HTMLElement, title?: string): void {
  // Create hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  const iframeDocument = iframe.contentDocument;

  if (!iframeWindow || !iframeDocument) {
    console.error('Failed to create print iframe');
    document.body.removeChild(iframe);
    return;
  }

  // Clone element to avoid modifying original
  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Get all stylesheets from parent document
  const styles = Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        // Try to get CSS rules
        return Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n');
      } catch (e) {
        // Cross-origin stylesheets may throw error
        console.warn('Unable to access stylesheet:', styleSheet.href);
        // Try to link external stylesheet instead
        if (styleSheet.href) {
          return `@import url("${styleSheet.href}");`;
        }
        return '';
      }
    })
    .join('\n');

  // Build print document
  const printDocument = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'Print'}</title>
        <style>
          ${styles}

          /* Print-specific styles */
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }

            /* Hide elements with no-print class */
            .no-print {
              display: none !important;
            }

            /* Avoid page breaks inside elements */
            table, figure, img {
              page-break-inside: avoid;
            }

            /* Ensure proper text rendering */
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }

          @page {
            margin: 1cm;
          }
        </style>
      </head>
      <body>
        ${clonedElement.outerHTML}
      </body>
    </html>
  `;

  // Write document to iframe
  iframeDocument.open();
  iframeDocument.write(printDocument);
  iframeDocument.close();

  // Wait for content to load, then print
  iframeWindow.onload = () => {
    // Small delay to ensure styles are applied
    setTimeout(() => {
      iframeWindow.focus();
      iframeWindow.print();

      // Cleanup after print dialog closes
      // Note: There's no reliable cross-browser way to detect print dialog close
      // We'll cleanup after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };

  // Fallback cleanup if onload doesn't fire
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }, 10000);
}

/**
 * Print current page
 * Simpler alternative to printReport for printing entire page
 */
export function printPage(): void {
  window.print();
}

/**
 * Open print preview for element
 * Creates new window with element content for printing
 *
 * @param element - HTML element to print
 * @param title - Optional document title
 */
export function printPreview(element: HTMLElement, title?: string): void {
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (!printWindow) {
    console.error('Failed to open print preview window. Check popup blocker.');
    return;
  }

  // Clone element
  const clonedElement = element.cloneNode(true) as HTMLElement;

  // Get all stylesheets
  const styles = Array.from(document.styleSheets)
    .map((styleSheet) => {
      try {
        return Array.from(styleSheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n');
      } catch (e) {
        if (styleSheet.href) {
          return `@import url("${styleSheet.href}");`;
        }
        return '';
      }
    })
    .join('\n');

  // Build preview document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${title || 'Print Preview'}</title>
        <style>
          ${styles}
          body {
            padding: 20px;
            font-family: Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        ${clonedElement.outerHTML}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Check if browser supports downloads
 * @returns true if download attribute is supported
 */
export function supportsDownload(): boolean {
  const a = document.createElement('a');
  return typeof a.download !== 'undefined';
}

/**
 * Get file extension from filename
 * @param filename - Filename to parse
 * @returns File extension (without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
}

/**
 * Ensure filename has correct extension
 * @param filename - Original filename
 * @param expectedExtension - Expected extension (without dot)
 * @returns Filename with correct extension
 */
export function ensureFileExtension(
  filename: string,
  expectedExtension: string,
): string {
  const currentExtension = getFileExtension(filename);
  const normalizedExpected = expectedExtension.toLowerCase().replace(/^\./, '');

  if (currentExtension === normalizedExpected) {
    return filename;
  }

  // Remove incorrect extension if present
  if (currentExtension) {
    filename = filename.substring(0, filename.lastIndexOf('.'));
  }

  return `${filename}.${normalizedExpected}`;
}
