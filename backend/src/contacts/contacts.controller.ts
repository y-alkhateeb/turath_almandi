import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { QueryContactsDto } from './dto/query-contacts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchAccessGuard } from '../common/guards/branch-access.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/interfaces';

@Controller('contacts')
@UseGuards(JwtAuthGuard, BranchAccessGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() createContactDto: CreateContactDto, @CurrentUser() user: RequestUser) {
    return this.contactsService.create(createContactDto, user);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser, @Query() query: QueryContactsDto) {
    return this.contactsService.findAll(user, query);
  }

  @Get('summary')
  getSummary(@CurrentUser() user: RequestUser, @Query('branchId') branchId?: string) {
    return this.contactsService.getSummary(user, branchId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.contactsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.contactsService.update(id, updateContactDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.contactsService.remove(id, user);
  }
}
