import { Module } from '@nestjs/common';
import { DiscountReasonsService } from './discount-reasons.service';
import { DiscountReasonsController } from './discount-reasons.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscountReasonsController],
  providers: [DiscountReasonsService],
  exports: [DiscountReasonsService],
})
export class DiscountReasonsModule {}
