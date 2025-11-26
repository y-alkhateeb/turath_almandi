import { Reflector } from '@nestjs/core';
import { UserRole } from '../types/prisma-enums';

export const Roles = Reflector.createDecorator<UserRole[]>();
