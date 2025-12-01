import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogService } from '../common/audit-log/audit-log.service';

@Module({
  imports: [PrismaModule],
  controllers: [ContactsController],
  providers: [ContactsService, AuditLogService],
  exports: [ContactsService],
})
export class ContactsModule {}
