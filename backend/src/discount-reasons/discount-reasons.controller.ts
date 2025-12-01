import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { DiscountReasonsService } from './discount-reasons.service';
import { CreateDiscountReasonDto } from './dto/create-discount-reason.dto';
import { UpdateDiscountReasonDto } from './dto/update-discount-reason.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';

@Controller('discount-reasons')
@UseGuards(JwtAuthGuard)
export class DiscountReasonsController {
  constructor(private readonly discountReasonsService: DiscountReasonsService) {}

  @Post()
  create(@Body(ValidationPipe) dto: CreateDiscountReasonDto) {
    return this.discountReasonsService.create(dto);
  }

  @Get()
  findAll() {
    return this.discountReasonsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.discountReasonsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateDiscountReasonDto,
  ) {
    return this.discountReasonsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.discountReasonsService.remove(id, user);
  }
}
