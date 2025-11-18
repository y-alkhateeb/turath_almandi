/**
 * Supported import formats
 */
export enum ImportFormat {
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'excel',
}

/**
 * Import mode determines how conflicts are handled
 */
export enum ImportMode {
  /**
   * Create only - fail if record already exists
   */
  CREATE_ONLY = 'create_only',

  /**
   * Update only - fail if record doesn't exist
   */
  UPDATE_ONLY = 'update_only',

  /**
   * Upsert - update if exists, create if doesn't exist
   */
  UPSERT = 'upsert',

  /**
   * Skip existing records
   */
  SKIP_EXISTING = 'skip_existing',
}

/**
 * Import options interface
 */
export interface ImportOptions {
  /**
   * The format of the import file
   */
  format: ImportFormat;

  /**
   * Import mode - how to handle conflicts
   */
  mode: ImportMode;

  /**
   * Field mapping from import file to entity (key: import field, value: entity field)
   */
  fieldMapping?: Record<string, string>;

  /**
   * Whether to validate records before importing
   */
  validateBeforeImport?: boolean;

  /**
   * Whether to stop on first error or continue
   */
  stopOnError?: boolean;

  /**
   * Maximum number of records to import (0 = unlimited)
   */
  maxRecords?: number;

  /**
   * Skip the first N rows (useful for headers)
   */
  skipRows?: number;
}

/**
 * Import validation error
 */
export interface ImportValidationError {
  /**
   * Row number where the error occurred
   */
  row: number;

  /**
   * Field name where the error occurred
   */
  field?: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Error code for programmatic handling
   */
  code?: string;

  /**
   * The invalid value
   */
  value?: unknown;
}

/**
 * Import result interface
 */
export interface ImportResult {
  /**
   * Number of records successfully imported
   */
  successCount: number;

  /**
   * Number of records that failed to import
   */
  errorCount: number;

  /**
   * Number of records skipped
   */
  skippedCount: number;

  /**
   * Total number of records processed
   */
  totalRecords: number;

  /**
   * Validation and import errors
   */
  errors: ImportValidationError[];

  /**
   * Whether the import completed successfully (no errors)
   */
  success: boolean;

  /**
   * Additional information about the import
   */
  metadata?: Record<string, unknown>;
}

/**
 * Importable interface
 * Defines operations for importing data from various formats
 * Services implementing this interface can import data from CSV, JSON, or Excel files
 */
export interface IImportable {
  /**
   * Import data from a file
   * @param file - The file data as a buffer or string
   * @param options - Import options including format, mode, field mapping, etc.
   * @returns Import result with success/error counts and validation errors
   */
  import(file: Buffer | string, options: ImportOptions): Promise<ImportResult>;

  /**
   * Validate import data without actually importing
   * @param file - The file data as a buffer or string
   * @param options - Import options
   * @returns Array of validation errors (empty if valid)
   */
  validateImport(file: Buffer | string, options: ImportOptions): Promise<ImportValidationError[]>;

  /**
   * Get a template file for importing data
   * @param format - The format of the template file
   * @returns Template file data
   */
  getImportTemplate(format: ImportFormat): Promise<Buffer | string>;

  /**
   * Get the required fields for import
   * @returns Array of required field names
   */
  getRequiredImportFields(): string[];

  /**
   * Get the optional fields for import
   * @returns Array of optional field names
   */
  getOptionalImportFields(): string[];
}
