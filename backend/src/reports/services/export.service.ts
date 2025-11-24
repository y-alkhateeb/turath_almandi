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
    const baseFileName = customFileName || `report-${timestamp}`;

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

    // Header row
    lines.push(visibleFields.map((f) => `"${f.displayName}"`).join(','));

    // Data rows
    for (const row of data) {
      const values = visibleFields.map((field) => {
        const value = row[field.sourceField];
        if (value === null || value === undefined) return '""';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return `"${String(value)}"`;
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
              ${visibleFields.map((f) => `<th>${f.displayName}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
    `;

    for (const row of data) {
      html += '<tr>';
      for (const field of visibleFields) {
        const value = row[field.sourceField] ?? '';
        html += `<td>${String(value)}</td>`;
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
