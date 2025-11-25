import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ReportConfiguration,
  ReportFilter,
  ReportOrderBy,
  ReportField,
  ReportAggregation,
  ReportGroupBy,
  QueryResult,
  ReportResultRow,
  AggregationResult,
  GroupedResult,
  ReportUserContext,
  DataSourceType,
  isSingleValueFilter,
  isArrayValueFilter,
  isRangeFilter,
  isNullCheckFilter,
  isValidDataSource,
  isValidFilterOperator,
} from '../types/report.types';
import { getPrismaDelegate } from '../types/prisma-mappings.types';

// ============================================
// FILTER CONDITION BUILDER
// ============================================

type PrismaFilterValue =
  | string
  | number
  | boolean
  | Date
  | null
  | { equals?: string | number | boolean | Date | null }
  | { not?: string | number | boolean | Date | null }
  | { gt?: number | Date }
  | { gte?: number | Date }
  | { lt?: number | Date }
  | { lte?: number | Date }
  | { contains?: string; mode?: 'insensitive' }
  | { startsWith?: string; mode?: 'insensitive' }
  | { endsWith?: string; mode?: 'insensitive' }
  | { in?: ReadonlyArray<string | number> }
  | { notIn?: ReadonlyArray<string | number> };

type WhereCondition = Record<string, PrismaFilterValue>;

@Injectable()
export class QueryBuilderService {
  private readonly logger = new Logger(QueryBuilderService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute a report query with full type safety
   */
  async executeQuery(
    config: ReportConfiguration,
    userContext: ReportUserContext,
  ): Promise<QueryResult> {
    const startTime = Date.now();

    // Validate data source
    if (!isValidDataSource(config.dataSource.type)) {
      throw new BadRequestException(`Invalid data source: ${config.dataSource.type}`);
    }

    const dataSource = config.dataSource.type;

    // Build query components
    const whereClause = this.buildWhereClause(config.filters, userContext, dataSource);
    const selectClause = this.buildSelectClause(config.fields);
    const orderByClause = this.buildOrderByClause(config.orderBy);

    // Execute main query
    const delegate = getPrismaDelegate(this.prisma, dataSource);

    // Get total count
    // Using any cast as Prisma delegate types are dynamically determined at runtime
    const totalCount = await (delegate as any).count({
      where: whereClause,
    });

    // Build findMany args
    const findManyArgs: {
      where: WhereCondition;
      select?: Record<string, boolean>;
      orderBy?: Array<Record<string, 'asc' | 'desc'>>;
      skip?: number;
      take?: number;
    } = {
      where: whereClause,
      orderBy: orderByClause,
    };

    // Add select if specific fields requested
    if (Object.keys(selectClause).length > 0) {
      findManyArgs.select = selectClause;
    }

    // Add pagination
    if (config.pagination?.enabled) {
      findManyArgs.skip = (config.pagination.page - 1) * config.pagination.pageSize;
      findManyArgs.take = config.pagination.pageSize;
    }

    // Execute query
    // Using any cast as Prisma delegate types are dynamically determined at runtime
    const rawData = await (delegate as any).findMany(findManyArgs);

    // Format results
    const data = this.formatResults(rawData, config.fields);

    // Calculate aggregations if requested
    let aggregations: AggregationResult | undefined;
    if (config.aggregations && config.aggregations.length > 0) {
      aggregations = await this.executeAggregations(
        dataSource,
        whereClause,
        config.aggregations,
      );
    }

    // Group data if requested
    let groupedData: ReadonlyArray<GroupedResult> | undefined;
    if (config.groupBy && config.groupBy.length > 0) {
      groupedData = this.groupResults(data, config.groupBy, config.aggregations);
    }

    const executionTime = Date.now() - startTime;

    return {
      data,
      totalCount,
      aggregations,
      groupedData,
      executionTime,
    };
  }

  /**
   * Build WHERE clause from filters with RBAC
   */
  private buildWhereClause(
    filters: ReadonlyArray<ReportFilter>,
    userContext: ReportUserContext,
    dataSource: DataSourceType,
  ): WhereCondition {
    const conditions: WhereCondition[] = [];

    // Data sources that have deletedAt field (branches doesn't have it)
    const softDeleteSources: DataSourceType[] = ['transactions', 'debts', 'inventory', 'salaries'];

    // Exclude soft-deleted records only for models that support it
    if (softDeleteSources.includes(dataSource)) {
      conditions.push({ deletedAt: null });
    }

    // Apply RBAC - Accountants can only see their branch
    if (userContext.role === 'ACCOUNTANT' && userContext.branchId) {
      // Only apply branchId filter for data sources that have it
      if (['transactions', 'debts', 'inventory', 'salaries'].includes(dataSource)) {
        conditions.push({ branchId: userContext.branchId });
      }
    }

    // Build filter conditions
    for (const filter of filters) {
      if (!isValidFilterOperator(filter.operator)) {
        this.logger.warn(`Invalid filter operator: ${filter.operator}`);
        continue;
      }

      const condition = this.buildFilterCondition(filter);
      if (condition) {
        conditions.push(condition);
      }
    }

    // Combine conditions with AND
    if (conditions.length === 0) {
      return {};
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return { AND: conditions } as WhereCondition;
  }

  /**
   * Build a single filter condition
   */
  private buildFilterCondition(filter: ReportFilter): WhereCondition | null {
    const { field, operator } = filter;

    if (isNullCheckFilter(filter)) {
      return this.buildNullCheckCondition(field, operator as 'isNull' | 'isNotNull');
    }

    if (isRangeFilter(filter)) {
      return this.buildRangeCondition(field, filter.value);
    }

    if (isArrayValueFilter(filter)) {
      return this.buildArrayCondition(field, operator as 'in' | 'notIn', filter.value);
    }

    if (isSingleValueFilter(filter)) {
      return this.buildSingleValueCondition(field, operator, filter.value);
    }

    return null;
  }

  /**
   * Build null check condition
   */
  private buildNullCheckCondition(
    field: string,
    operator: 'isNull' | 'isNotNull',
  ): WhereCondition {
    if (operator === 'isNull') {
      return { [field]: { equals: null } };
    }
    return { [field]: { not: null } };
  }

  /**
   * Build range (between) condition
   */
  private buildRangeCondition(
    field: string,
    value: readonly [string | number | Date, string | number | Date],
  ): WhereCondition {
    const [min, max] = value;
    return {
      [field]: {
        gte: this.convertValue(min),
        lte: this.convertValue(max),
      },
    } as WhereCondition;
  }

  /**
   * Build array (in/notIn) condition
   */
  private buildArrayCondition(
    field: string,
    operator: 'in' | 'notIn',
    value: ReadonlyArray<string | number>,
  ): WhereCondition {
    if (operator === 'in') {
      return { [field]: { in: [...value] } };
    }
    return { [field]: { notIn: [...value] } };
  }

  /**
   * Build single value condition
   */
  private buildSingleValueCondition(
    field: string,
    operator: string,
    value: string | number | boolean | Date,
  ): WhereCondition {
    const convertedValue = this.convertValue(value);

    switch (operator) {
      case 'equals':
        return { [field]: { equals: convertedValue } };
      case 'notEquals':
        return { [field]: { not: convertedValue } };
      case 'greaterThan':
        return { [field]: { gt: convertedValue as number | Date } };
      case 'greaterThanOrEqual':
        return { [field]: { gte: convertedValue as number | Date } };
      case 'lessThan':
        return { [field]: { lt: convertedValue as number | Date } };
      case 'lessThanOrEqual':
        return { [field]: { lte: convertedValue as number | Date } };
      case 'contains':
        return { [field]: { contains: String(convertedValue), mode: 'insensitive' } };
      case 'startsWith':
        return { [field]: { startsWith: String(convertedValue), mode: 'insensitive' } };
      case 'endsWith':
        return { [field]: { endsWith: String(convertedValue), mode: 'insensitive' } };
      default:
        return { [field]: { equals: convertedValue } };
    }
  }

  /**
   * Convert value to appropriate type
   */
  private convertValue(value: string | number | boolean | Date): string | number | boolean | Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'string') {
      // Try to parse as date
      const datePattern = /^\d{4}-\d{2}-\d{2}/;
      if (datePattern.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Try to parse as number
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== '') {
        return num;
      }

      // Try to parse as boolean
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }

    return value;
  }

  /**
   * Build SELECT clause from fields
   */
  private buildSelectClause(fields: ReadonlyArray<ReportField>): Record<string, boolean> {
    const select: Record<string, boolean> = {
      id: true, // Always include ID
    };

    for (const field of fields) {
      if (field.visible) {
        select[field.sourceField] = true;
      }
    }

    return select;
  }

  /**
   * Build ORDER BY clause
   */
  private buildOrderByClause(
    orderBy: ReadonlyArray<ReportOrderBy>,
  ): Array<Record<string, 'asc' | 'desc'>> {
    return orderBy.map((order) => ({
      [order.field]: order.direction,
    }));
  }

  /**
   * Execute aggregations
   */
  private async executeAggregations(
    dataSource: DataSourceType,
    whereClause: WhereCondition,
    aggregations: ReadonlyArray<ReportAggregation>,
  ): Promise<AggregationResult> {
    const result: Record<string, number | null> = {};

    const delegate = getPrismaDelegate(this.prisma, dataSource);

    // Build aggregate args
    const aggregateArgs: Record<string, Record<string, boolean>> = {};

    for (const agg of aggregations) {
      const prismaAggFunction = this.mapAggregationFunction(agg.function);
      if (!aggregateArgs[prismaAggFunction]) {
        aggregateArgs[prismaAggFunction] = {};
      }
      aggregateArgs[prismaAggFunction][agg.field] = true;
    }

    // Execute aggregate query
    // Using any cast as Prisma delegate types are dynamically determined at runtime
    const aggregateResult = await (delegate as any).aggregate({
      where: whereClause,
      ...aggregateArgs,
    });

    // Map results to aliases
    for (const agg of aggregations) {
      const prismaAggFunction = this.mapAggregationFunction(agg.function);
      const aggResult = aggregateResult[prismaAggFunction];
      if (aggResult && agg.field in aggResult) {
        result[agg.alias] = aggResult[agg.field];
      }
    }

    return result;
  }

  /**
   * Map aggregation function to Prisma aggregate key
   */
  private mapAggregationFunction(func: string): string {
    const mapping: Record<string, string> = {
      sum: '_sum',
      avg: '_avg',
      count: '_count',
      min: '_min',
      max: '_max',
    };
    return mapping[func] || '_sum';
  }

  /**
   * Group results by fields
   */
  private groupResults(
    data: ReadonlyArray<ReportResultRow>,
    groupBy: ReadonlyArray<ReportGroupBy>,
    aggregations?: ReadonlyArray<ReportAggregation>,
  ): ReadonlyArray<GroupedResult> {
    const groups = new Map<string, ReportResultRow[]>();

    // Group data
    for (const row of data) {
      const groupKey = groupBy
        .map((g) => String(row[g.field] ?? 'null'))
        .join('|||');

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    }

    // Build grouped results
    const results: GroupedResult[] = [];

    for (const [keyString, rows] of groups) {
      const keyParts = keyString.split('|||');
      const groupKeyObj: Record<string, string | number | boolean | Date | null> = {};

      groupBy.forEach((g, index) => {
        const value = keyParts[index];
        groupKeyObj[g.field] = value === 'null' ? null : value;
      });

      // Calculate aggregations for group
      const groupAggregations: Record<string, number | null> = {};
      if (aggregations) {
        for (const agg of aggregations) {
          groupAggregations[agg.alias] = this.calculateLocalAggregation(
            rows,
            agg.field,
            agg.function,
          );
        }
      }

      results.push({
        groupKey: groupKeyObj,
        rows: rows,
        aggregations: groupAggregations,
      });
    }

    return results;
  }

  /**
   * Calculate aggregation locally (for grouped data)
   */
  private calculateLocalAggregation(
    rows: ReadonlyArray<ReportResultRow>,
    field: string,
    func: string,
  ): number | null {
    const values = rows
      .map((r) => r[field])
      .filter((v): v is number => typeof v === 'number');

    if (values.length === 0) return null;

    switch (func) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'count':
        return values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      default:
        return null;
    }
  }

  /**
   * Format results with display names
   */
  private formatResults(
    data: ReadonlyArray<ReportResultRow>,
    fields: ReadonlyArray<ReportField>,
  ): ReadonlyArray<ReportResultRow> {
    // Sort fields by order
    const sortedFields = [...fields]
      .filter((f) => f.visible)
      .sort((a, b) => a.order - b.order);

    return data.map((row) => {
      const formattedRow: ReportResultRow = {};

      for (const field of sortedFields) {
        const value = row[field.sourceField];
        formattedRow[field.sourceField] = this.formatValue(value, field.format);
      }

      // Always include ID
      if ('id' in row) {
        formattedRow['id'] = row['id'];
      }

      return formattedRow;
    });
  }

  /**
   * Format a value based on format type
   */
  private formatValue(
    value: string | number | boolean | Date | null,
    format?: string,
  ): string | number | boolean | Date | null {
    if (value === null || value === undefined) {
      return null;
    }

    // For now, return value as-is
    // Frontend will handle formatting
    return value;
  }
}
