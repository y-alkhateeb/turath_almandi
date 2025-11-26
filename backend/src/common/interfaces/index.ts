/**
 * Common interfaces for repository patterns and data operations
 *
 * This module provides a set of well-defined interfaces following SOLID principles:
 * - Interface Segregation Principle: Separate read and write operations
 * - Single Responsibility Principle: Each interface has a single, well-defined purpose
 *
 * Usage:
 * - Implement IReadRepository for services that only need read access
 * - Implement IWriteRepository for services that need write access
 * - Implement IExportable for services that support data export
 * - Implement IImportable for services that support data import
 */

// Repository interfaces
export * from './read-repository.interface';
export * from './write-repository.interface';

// Data operation interfaces
export * from './exportable.interface';
export * from './importable.interface';

// User interfaces
export * from './request-user.interface';
