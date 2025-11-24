import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportTemplate, ReportFieldMetadata, Prisma, ReportType } from '@prisma/client';
import {
  ReportConfiguration,
  ReportUserContext,
  FieldMetadata,
  DataSourceType,
  isValidDataSource,
  DATA_SOURCES,
} from '../types/report.types';

// ============================================
// DTOs (inline for clarity)
// ============================================

export interface CreateTemplateInput {
  readonly name: string;
  readonly description?: string;
  readonly reportType: ReportType;
  readonly config: ReportConfiguration;
  readonly isPublic: boolean;
}

export interface UpdateTemplateInput {
  readonly name?: string;
  readonly description?: string;
  readonly config?: ReportConfiguration;
  readonly isPublic?: boolean;
  readonly isDefault?: boolean;
}

@Injectable()
export class ReportConfigService {
  private readonly logger = new Logger(ReportConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new report template
   */
  async createTemplate(
    input: CreateTemplateInput,
    userContext: ReportUserContext,
  ): Promise<ReportTemplate> {
    // Only admins can create templates
    if (userContext.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can create report templates');
    }

    // Validate configuration
    this.validateConfiguration(input.config);

    return this.prisma.reportTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        reportType: input.reportType,
        config: input.config as unknown as Prisma.JsonObject,
        isPublic: input.isPublic,
        createdById: userContext.userId,
      },
    });
  }

  /**
   * Get templates available to user
   */
  async getUserTemplates(
    userContext: ReportUserContext,
  ): Promise<ReportTemplate[]> {
    const where: Prisma.ReportTemplateWhereInput = {
      deletedAt: null,
      OR: [
        { isPublic: true },
        { createdById: userContext.userId },
      ],
    };

    return this.prisma.reportTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  /**
   * Get template by ID
   */
  async getTemplateById(
    id: string,
    userContext: ReportUserContext,
  ): Promise<ReportTemplate> {
    const template = await this.prisma.reportTemplate.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { isPublic: true },
          { createdById: userContext.userId },
        ],
      },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    input: UpdateTemplateInput,
    userContext: ReportUserContext,
  ): Promise<ReportTemplate> {
    // Check ownership
    const existing = await this.prisma.reportTemplate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    if (existing.createdById !== userContext.userId && userContext.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own templates');
    }

    // Validate config if provided
    if (input.config) {
      this.validateConfiguration(input.config);
    }

    // If setting as default, unset other defaults of same type
    if (input.isDefault) {
      await this.prisma.reportTemplate.updateMany({
        where: {
          reportType: existing.reportType,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.reportTemplate.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.config && { config: input.config as unknown as Prisma.JsonObject }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      },
    });
  }

  /**
   * Soft delete template
   */
  async deleteTemplate(
    id: string,
    userContext: ReportUserContext,
  ): Promise<void> {
    const existing = await this.prisma.reportTemplate.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    if (existing.createdById !== userContext.userId && userContext.role !== 'ADMIN') {
      throw new ForbiddenException('You can only delete your own templates');
    }

    await this.prisma.reportTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Get available fields for a data source
   */
  async getAvailableFields(dataSource: DataSourceType): Promise<FieldMetadata[]> {
    if (!isValidDataSource(dataSource)) {
      throw new BadRequestException(`Invalid data source: ${dataSource}`);
    }

    const fields = await this.prisma.reportFieldMetadata.findMany({
      where: { dataSource },
      orderBy: [
        { defaultOrder: 'asc' },
        { displayName: 'asc' },
      ],
    });

    return fields.map((f) => ({
      id: f.id,
      dataSource: f.dataSource as DataSourceType,
      fieldName: f.fieldName,
      displayName: f.displayName,
      description: f.description ?? undefined,
      dataType: f.dataType as FieldMetadata['dataType'],
      filterable: f.filterable,
      sortable: f.sortable,
      aggregatable: f.aggregatable,
      groupable: f.groupable,
      defaultVisible: f.defaultVisible,
      defaultOrder: f.defaultOrder,
      category: f.category ?? undefined,
      format: f.format as FieldMetadata['format'],
      enumValues: f.enumValues as string[] | undefined,
    }));
  }

  /**
   * Get all data sources
   */
  getDataSources(): ReadonlyArray<{ value: DataSourceType; label: string }> {
    return [
      { value: 'transactions', label: 'المعاملات المالية' },
      { value: 'debts', label: 'الديون' },
      { value: 'inventory', label: 'المخزون' },
      { value: 'salaries', label: 'الرواتب' },
      { value: 'branches', label: 'الفروع' },
    ];
  }

  /**
   * Validate report configuration
   */
  private validateConfiguration(config: ReportConfiguration): void {
    // Validate data source
    if (!isValidDataSource(config.dataSource.type)) {
      throw new BadRequestException(`Invalid data source: ${config.dataSource.type}`);
    }

    // Validate fields
    if (!config.fields || config.fields.length === 0) {
      throw new BadRequestException('At least one field is required');
    }

    // Validate each field has required properties
    for (const field of config.fields) {
      if (!field.sourceField || !field.displayName) {
        throw new BadRequestException('Each field must have sourceField and displayName');
      }
    }

    // Validate filters
    for (const filter of config.filters) {
      if (!filter.field || !filter.operator) {
        throw new BadRequestException('Each filter must have field and operator');
      }
    }

    // Validate orderBy
    for (const order of config.orderBy) {
      if (!order.field || !order.direction) {
        throw new BadRequestException('Each orderBy must have field and direction');
      }
    }
  }

  /**
   * Log report execution
   */
  async logExecution(
    templateId: string | null,
    config: ReportConfiguration,
    filters: ReadonlyArray<unknown>,
    resultCount: number,
    executionTime: number,
    userContext: ReportUserContext,
    exportFormat?: string,
    fileSize?: number,
  ): Promise<void> {
    await this.prisma.reportExecution.create({
      data: {
        templateId,
        config: config as unknown as Prisma.JsonObject,
        appliedFilters: filters as unknown as Prisma.JsonArray,
        resultCount,
        executionTime,
        exportFormat,
        fileSize,
        executedById: userContext.userId,
      },
    });
  }
}
