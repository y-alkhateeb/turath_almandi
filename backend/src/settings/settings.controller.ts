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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SettingsService } from './settings.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { SetDefaultCurrencyDto } from './dto/set-default-currency.dto';
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

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get the default currency (public endpoint)
   */
  @Get('currency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get default currency',
    description: 'Returns the default currency settings. This endpoint is public and does not require authentication.'
  })
  @ApiResponse({
    status: 200,
    description: 'Default currency retrieved successfully'
  })
  @ApiResponse({
    status: 404,
    description: 'Default currency not found'
  })
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
  @ApiOperation({
    summary: 'Get all currencies',
    description: 'Returns all currencies with their usage statistics (transaction counts). Admin access required.'
  })
  @ApiResponse({
    status: 200,
    description: 'Currencies retrieved successfully'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required'
  })
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
  @ApiOperation({
    summary: 'Set default currency',
    description: 'Sets a currency as the default. Only one currency can be default at a time. Admin access required.'
  })
  @ApiResponse({
    status: 200,
    description: 'Default currency updated successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid currency code'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required'
  })
  @ApiResponse({
    status: 404,
    description: 'Currency not found'
  })
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
  @ApiOperation({
    summary: 'Create new currency',
    description: 'Creates a new currency in the system. The currency will not be set as default automatically. Admin access required.'
  })
  @ApiResponse({
    status: 201,
    description: 'Currency created successfully'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required'
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Currency code already exists'
  })
  createCurrency(
    @Body() dto: CreateCurrencyDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.settingsService.createCurrency(dto, user.id);
  }
}
