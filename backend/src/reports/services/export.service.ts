import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReportField, ReportResultRow } from '../types/report.types';

interface ExportResult {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}

@Injectable()
export class ExportService {
  async export(
    data: ReadonlyArray<ReportResultRow>,
    fields: ReadonlyArray<ReportField>,
    format: 'excel' | 'pdf' | 'csv',
    customFileName?: string,
  ): Promise<ExportResult> {
    const timestamp = new Date().toISOString().split('T')[0];
    const rawFileName = customFileName || `report-${timestamp}`;

    // Sanitize filename to prevent path traversal and header injection attacks
    const baseFileName = this.sanitizeFileName(rawFileName);

    switch (format) {
      case 'excel':
        return this.exportToExcel(data, fields, baseFileName);
      case 'csv':
        return this.exportToCsv(data, fields, baseFileName);
      case 'pdf':
        return this.exportToPdf(data, fields, baseFileName);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Sanitize filename to prevent path traversal, CRLF injection, and other attacks
   * Following RFC 6266 and OWASP best practices:
   * - Removes path separators (/, \)
   * - Removes relative path segments (.., .)
   * - Removes control characters (CRLF, null bytes, etc.)
   * - Removes special filesystem characters
   * - Limits length to 200 characters (safe limit for all filesystems)
   * - Falls back to timestamp if result is empty
   */
  private sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return `report-${Date.now()}`;
    }

    // Remove path separators and relative path segments
    let sanitized = fileName
      .replace(/[\/\\]/g, '_')           // Replace / and \ with underscore
      .replace(/\.\./g, '_')             // Replace .. with underscore
      .replace(/^\.+/, '')               // Remove leading dots
      .replace(/[\x00-\x1F\x7F]/g, '')   // Remove control characters (including CRLF, null bytes)
      .replace(/[<>:"|?*]/g, '_')        // Replace special filesystem chars
      .trim();                            // Remove leading/trailing whitespace

    // Limit length (255 is filesystem limit, use 200 to leave room for extension)
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200);
    }

    // If empty after sanitization, use timestamp
    if (!sanitized || sanitized.length === 0) {
      sanitized = `report-${Date.now()}`;
    }

    return sanitized;
  }

  private async exportToExcel(
    data: ReadonlyArray<ReportResultRow>,
    fields: ReadonlyArray<ReportField>,
    fileName: string,
  ): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير');

    // Setup RTL
    worksheet.views = [{ rightToLeft: true }];

    // Get visible fields sorted by order
    const visibleFields = [...fields]
      .filter((f) => f.visible)
      .sort((a, b) => a.order - b.order);

    // Add headers
    worksheet.columns = visibleFields.map((field) => ({
      header: field.displayName,
      key: field.sourceField,
      width: field.width || 20,
    }));

    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1a365d' },
    };
    headerRow.font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data
    for (const row of data) {
      const rowData: Record<string, string | number | boolean | Date | null> = {};
      for (const field of visibleFields) {
        rowData[field.sourceField] = row[field.sourceField] ?? null;
      }
      worksheet.addRow(rowData);
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(buffer),
      fileName: `${fileName}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * Prevent CSV injection/formula injection by prepending single quote to dangerous values.
   * See: https://owasp.org/www-community/attacks/CSV_Injection
   */
  private sanitizeForCsv(value: string | number | boolean | Date | null | undefined): string {
    if (value === null || value === undefined) return '';
    let str = String(value);
    // Check for dangerous initial characters (formula injection)
    if (/^[=\+\-\@]/.test(str)) {
      str = "'" + str;
    }
    // Escape quotes for CSV
    str = str.replace(/"/g, '""');
    // Remove newlines/carriage returns to prevent CSV-breaking.
    str = str.replace(/[\r\n]+/g, ' ');
    return str;
  }

  private async exportToCsv(
    data: ReadonlyArray<ReportResultRow>,
    fields: ReadonlyArray<ReportField>,
    fileName: string,
  ): Promise<ExportResult> {
    const visibleFields = [...fields]
      .filter((f) => f.visible)
      .sort((a, b) => a.order - b.order);

    // Build CSV content
    const lines: string[] = [];

    // Header row - sanitize each header field (displayName)
    lines.push(visibleFields.map((f) => `"${this.sanitizeForCsv(f.displayName)}"`).join(','));

    // Data rows
    for (const row of data) {
      const values = visibleFields.map((field) => {
        const value = row[field.sourceField];
        // Always sanitize
        return `"${this.sanitizeForCsv(value)}"`;
      });
      lines.push(values.join(','));
    }

    // Add BOM for UTF-8
    const csvContent = '\uFEFF' + lines.join('\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    return {
      buffer,
      fileName: `${fileName}.csv`,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  /**
   * Escape HTML to prevent XSS attacks in PDF/HTML exports
   * Escapes: < > & " ' to their HTML entity equivalents
   */
  private escapeHtml(unsafe: string | number | boolean | Date | null | undefined): string {
    if (unsafe === null || unsafe === undefined) {
      return '';
    }

    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async exportToPdf(
    data: ReadonlyArray<ReportResultRow>,
    fields: ReadonlyArray<ReportField>,
    fileName: string,
  ): Promise<ExportResult> {
    // For PDF, we'll generate HTML and convert
    // This is a simplified version - consider using puppeteer for better PDF
    const visibleFields = [...fields]
      .filter((f) => f.visible)
      .sort((a, b) => a.order - b.order);

    // Escape all HTML to prevent XSS attacks
    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Arial', sans-serif; direction: rtl; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #1a365d; color: white; }
          tr:nth-child(even) { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>تقرير</h1>
        <table>
          <thead>
            <tr>
              ${visibleFields.map((f) => `<th>${this.escapeHtml(f.displayName)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    for (const row of data) {
      html += '<tr>';
      for (const field of visibleFields) {
        const value = row[field.sourceField];
        html += `<td>${this.escapeHtml(value)}</td>`;
      }
      html += '</tr>';
    }

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    // For now, return HTML as PDF placeholder
    // In production, use puppeteer or similar for proper PDF generation
    const buffer = Buffer.from(html, 'utf-8');

    return {
      buffer,
      fileName: `${fileName}.html`, // Change to .pdf with proper PDF generation
      contentType: 'text/html; charset=utf-8',
    };
  }
}
