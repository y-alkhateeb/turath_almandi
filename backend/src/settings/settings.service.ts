import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { SetDefaultCurrencyDto } from './dto/set-default-currency.dto';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { AuditLogService, AuditEntityType } from '../common/audit-log/audit-log.service';
import { APP_CONSTANTS } from '../common/constants/app.constants';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  /**
   * Get the default currency
   * @returns The default currency settings
   */
  async getDefaultCurrency() {
    const defaultCurrency = await this.prisma.currencySettings.findFirst({
      where: { isDefault: true },
      select: {
        id: true,
        code: true,
        nameAr: true,
        nameEn: true,
        symbol: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!defaultCurrency) {
      throw new NotFoundException('لم يتم العثور على عملة افتراضية');
    }

    return defaultCurrency;
  }

  /**
   * Get all currencies
   * Currency is only for frontend display - not stored in transaction tables
   * @returns Array of currencies
   */
  async getAllCurrencies() {
    return await this.prisma.currencySettings.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { code: 'asc' },
      ],
      select: {
        id: true,
        code: true,
        nameAr: true,
        nameEn: true,
        symbol: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Set a currency as the default
   * @param dto - Currency code to set as default
   * @param currentUserId - User ID for audit logging
   * @returns The updated default currency
   */
  async setDefaultCurrency(dto: SetDefaultCurrencyDto, currentUserId?: string) {
    // Check if the currency exists
    const currency = await this.prisma.currencySettings.findUnique({
      where: { code: dto.code },
    });

    if (!currency) {
      throw new NotFoundException(`العملة بالرمز ${dto.code} غير موجودة`);
    }

    // If it's already the default, return it
    if (currency.isDefault) {
      return currency;
    }

    // Use a transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // First, unset any existing default
      await tx.currencySettings.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      // Then set the new default
      const updatedCurrency = await tx.currencySettings.update({
        where: { code: dto.code },
        data: { isDefault: true },
      });

      return updatedCurrency;
    });

    // Log the change in audit log if currentUserId is provided
    if (currentUserId) {
      await this.auditLogService.logUpdate(
        currentUserId,
        AuditEntityType.SETTINGS,
        result.id,
        { isDefault: false },
        { isDefault: true },
      );
    }

    return result;
  }

  /**
   * Create a new currency
   * @param dto - Currency data
   * @param currentUserId - User ID for audit logging
   * @returns The created currency
   */
  async createCurrency(dto: CreateCurrencyDto, currentUserId?: string) {
    // Check if currency with this code already exists
    const existingCurrency = await this.prisma.currencySettings.findUnique({
      where: { code: dto.code },
    });

    if (existingCurrency) {
      throw new ConflictException(`العملة بالرمز ${dto.code} موجودة بالفعل`);
    }

    // Create the new currency (will not be default by default)
    const currency = await this.prisma.currencySettings.create({
      data: {
        code: dto.code,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        symbol: dto.symbol,
        isDefault: false,
      },
    });

    // Log the creation in audit log if currentUserId is provided
    if (currentUserId) {
      await this.auditLogService.logCreate(
        currentUserId,
        AuditEntityType.SETTINGS,
        currency.id,
        currency,
      );
    }

    return currency;
  }

  /**
   * Get app settings
   * Returns static app name and icon URL, plus dynamic loginBackgroundUrl
   * @returns The app settings
   */
  async getAppSettings() {
    let settings = await this.prisma.appSettings.findFirst();

    // If no settings exist, create default settings
    if (!settings) {
      settings = await this.prisma.appSettings.create({
        data: {
          loginBackgroundUrl: null,
        },
      });
    }

    // Return static values for app name and icon, dynamic loginBackgroundUrl
    return {
      id: settings.id,
      appName: APP_CONSTANTS.APP_NAME,
      appIconUrl: APP_CONSTANTS.APP_ICON_URL,
      loginBackgroundUrl: settings.loginBackgroundUrl,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  /**
   * Update app settings
   * Only loginBackgroundUrl is updatable - appName and appIconUrl are static
   * @param dto - App settings data to update
   * @param currentUserId - User ID for audit logging
   * @returns The updated app settings
   */
  async updateAppSettings(dto: UpdateAppSettingsDto, currentUserId?: string) {
    // Get existing settings or create if none exist
    let settings = await this.prisma.appSettings.findFirst();

    if (!settings) {
      // Create new settings if none exist
      settings = await this.prisma.appSettings.create({
        data: {
          loginBackgroundUrl: dto.loginBackgroundUrl || null,
        },
      });

      // Log creation
      if (currentUserId) {
        await this.auditLogService.logCreate(
          currentUserId,
          AuditEntityType.SETTINGS,
          settings.id,
          settings,
        );
      }
    } else {
      // Update existing settings (only loginBackgroundUrl)
      const oldSettings = { ...settings };

      settings = await this.prisma.appSettings.update({
        where: { id: settings.id },
        data: {
          loginBackgroundUrl: dto.loginBackgroundUrl !== undefined ? dto.loginBackgroundUrl : settings.loginBackgroundUrl,
        },
      });

      // Log update
      if (currentUserId) {
        await this.auditLogService.logUpdate(
          currentUserId,
          AuditEntityType.SETTINGS,
          settings.id,
          oldSettings,
          settings,
        );
      }
    }

    // Return with static values
    return {
      id: settings.id,
      appName: APP_CONSTANTS.APP_NAME,
      appIconUrl: APP_CONSTANTS.APP_ICON_URL,
      loginBackgroundUrl: settings.loginBackgroundUrl,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
