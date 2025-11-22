import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { SetDefaultCurrencyDto } from './dto/set-default-currency.dto';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

interface RequestUser {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get the default currency (public endpoint)
   */
  @Get('currency')
  @HttpCode(HttpStatus.OK)
  getDefaultCurrency() {
    return this.settingsService.getDefaultCurrency();
  }

  /**
   * Get all currencies with transaction counts (admin only)
   */
  @Get('currencies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  getAllCurrencies() {
    return this.settingsService.getAllCurrencies();
  }

  /**
   * Set a currency as the default (admin only)
   */
  @Patch('currency/default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  setDefaultCurrency(
    @Body() dto: SetDefaultCurrencyDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settingsService.setDefaultCurrency(dto, user.id);
  }

  /**
   * Create a new currency (admin only)
   */
  @Post('currencies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.CREATED)
  createCurrency(
    @Body() dto: CreateCurrencyDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settingsService.createCurrency(dto, user.id);
  }

  /**
   * Get app settings (public endpoint)
   * Needed for login page to get background image
   */
  @Get('app')
  @HttpCode(HttpStatus.OK)
  getAppSettings() {
    return this.settingsService.getAppSettings();
  }

  /**
   * Update app settings (admin only)
   */
  @Patch('app')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRole.ADMIN])
  @HttpCode(HttpStatus.OK)
  updateAppSettings(
    @Body() dto: UpdateAppSettingsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settingsService.updateAppSettings(dto, user.id);
  }
}
