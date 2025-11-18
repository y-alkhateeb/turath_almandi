/**
 * Supported export formats
 */
export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'excel',
  PDF = 'pdf',
}

/**
 * Export options interface
 */
export interface ExportOptions {
  /**
   * The format to export data in
   */
  format: ExportFormat;

  /**
   * Fields to include in the export (if not specified, all fields are included)
   */
  fields?: string[];

  /**
   * Filter conditions for the data to export
   */
  filter?: Record<string, unknown>;

  /**
   * Date range for filtering data
   */
  dateRange?: {
    from: Date;
    to: Date;
  };

  /**
   * Column headers mapping (key: field name, value: display name)
   */
  headers?: Record<string, string>;

  /**
   * Additional metadata to include in the export
   */
  metadata?: Record<string, unknown>;
}

/**
 * Export result interface
 */
export interface ExportResult {
  /**
   * The exported data as a buffer or string
   */
  data: Buffer | string;

  /**
   * MIME type of the exported file
   */
  mimeType: string;

  /**
   * Suggested filename for the export
   */
  filename: string;

  /**
   * Number of records exported
   */
  recordCount: number;
}

/**
 * Exportable interface
 * Defines operations for exporting data in various formats
 * Services implementing this interface can export their data to CSV, JSON, Excel, or PDF
 */
export interface IExportable {
  /**
   * Export data based on the provided options
   * @param options - Export options including format, fields, filters, etc.
   * @returns Export result containing the data, MIME type, filename, and record count
   */
  export(options: ExportOptions): Promise<ExportResult>;

  /**
   * Get available fields that can be exported
   * @returns Array of field names that can be included in exports
   */
  getExportableFields(): string[];

  /**
   * Validate export options
   * @param options - Export options to validate
   * @returns True if options are valid, throws error otherwise
   */
  validateExportOptions(options: ExportOptions): Promise<boolean>;
}
