import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Check if username already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('اسم المستخدم موجود بالفعل');
    }

    // If branchId is provided, verify it exists
    if (createUserDto.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: createUserDto.branchId },
      });

      if (!branch) {
        throw new NotFoundException('الفرع غير موجود');
      }
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        passwordHash,
        role: createUserDto.role,
        branchId: createUserDto.branchId || null,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id); // Check existence

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });
  }

  async assignBranch(userId: string, branchId: string | null) {
    return this.update(userId, { branchId });
  }

  async remove(id: string) {
    await this.findOne(id); // Check existence

    // Soft delete by setting isActive to false
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
    });
  }
}
