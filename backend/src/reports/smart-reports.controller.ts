import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import * as contentDisposition from 'content-disposition';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { QueryBuilderService } from './services/query-builder.service';
import { ReportConfigService } from './services/report-config.service';
import { ExportService } from './services/export.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  ExecuteReportDto,
  ExportReportDto,
} from './dto/smart-reports.dto';
import {
  ReportConfiguration,
  ReportUserContext,
  DataSourceType,
  isValidDataSource,
} from './types/report.types';

interface JwtUser {
  id: string;
  role: 'ADMIN' | 'ACCOUNTANT';
  branchId?: string;
}

@ApiTags('Smart Reports')
@ApiBearerAuth()
@Controller('reports/smart')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SmartReportsController {
  constructor(
    private readonly queryBuilderService: QueryBuilderService,
    private readonly configService: ReportConfigService,
    private readonly exportService: ExportService,
  ) {}

  // ============================================
  // DATA SOURCES & FIELDS
  // ============================================

  @Get('data-sources')
  @ApiOperation({ summary: 'Get available data sources' })
  getDataSources() {
    return this.configService.getDataSources();
  }

  @Get('fields')
  @ApiOperation({ summary: 'Get available fields for data source' })
  @ApiQuery({ name: 'dataSource', enum: ['transactions', 'debts', 'inventory', 'salaries', 'branches'] })
  async getFields(@Query('dataSource') dataSource: string) {
    if (!isValidDataSource(dataSource)) {
      return { error: 'Invalid data source' };
    }
    return this.configService.getAvailableFields(dataSource as DataSourceType);
  }

  // ============================================
  // TEMPLATES CRUD
  // ============================================

  @Post('templates')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create report template' })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: JwtUser,
  ) {
    const userContext = this.buildUserContext(user);
    return this.configService.createTemplate(
      {
        name: dto.name,
        description: dto.description,
        reportType: dto.reportType,
        config: dto.config as ReportConfiguration,
        isPublic: dto.isPublic,
      },
      userContext,
    );
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get user templates' })
  async getTemplates(@CurrentUser() user: JwtUser) {
    const userContext = this.buildUserContext(user);
    return this.configService.getUserTemplates(userContext);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template by ID' })
  async getTemplate(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    const userContext = this.buildUserContext(user);
    return this.configService.getTemplateById(id, userContext);
  }

  @Put('templates/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update template' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: JwtUser,
  ) {
    const userContext = this.buildUserContext(user);
    return this.configService.updateTemplate(
      id,
      {
        name: dto.name,
        description: dto.description,
        config: dto.config as ReportConfiguration | undefined,
        isPublic: dto.isPublic,
        isDefault: dto.isDefault,
      },
      userContext,
    );
  }

  @Delete('templates/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete template' })
  async deleteTemplate(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
  ) {
    const userContext = this.buildUserContext(user);
    await this.configService.deleteTemplate(id, userContext);
    return { success: true };
  }

  // ============================================
  // EXECUTE & EXPORT
  // ============================================

  @Post('execute')
  @ApiOperation({ summary: 'Execute report query' })
  async executeReport(
    @Body() dto: ExecuteReportDto,
    @CurrentUser() user: JwtUser,
  ) {
    const userContext = this.buildUserContext(user);
    const result = await this.queryBuilderService.executeQuery(
      dto.config as ReportConfiguration,
      userContext,
    );

    // Log execution
    await this.configService.logExecution(
      null,
      dto.config as ReportConfiguration,
      dto.config.filters,
      result.totalCount,
      result.executionTime,
      userContext,
    );

    return result;
  }

  @Post('export')
  @ApiOperation({ summary: 'Export report' })
  @ApiQuery({ name: 'format', enum: ['excel', 'pdf', 'csv'] })
  async exportReport(
    @Body() dto: ExecuteReportDto,
    @Query('format') format: 'excel' | 'pdf' | 'csv',
    @CurrentUser() user: JwtUser,
    @Res() res: Response,
  ) {
    const userContext = this.buildUserContext(user);

    // Execute query
    const result = await this.queryBuilderService.executeQuery(
      dto.config as ReportConfiguration,
      userContext,
    );

    // Generate export
    const exportResult = await this.exportService.export(
      result.data,
      dto.config.fields,
      format,
      dto.config.exportOptions?.fileName,
    );

    // Log execution
    await this.configService.logExecution(
      null,
      dto.config as ReportConfiguration,
      dto.config.filters,
      result.totalCount,
      result.executionTime,
      userContext,
      format,
      exportResult.buffer.length,
    );

    // Send response with properly sanitized Content-Disposition header
    // Using content-disposition package to prevent header injection attacks (XSS/CRLF)
    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', contentDisposition(exportResult.fileName, { type: 'attachment' }));
    res.status(HttpStatus.OK).send(exportResult.buffer);
  }

  // ============================================
  // HELPERS
  // ============================================

  private buildUserContext(user: JwtUser): ReportUserContext {
    return {
      userId: user.id,
      role: user.role,
      branchId: user.branchId,
    };
  }
}
