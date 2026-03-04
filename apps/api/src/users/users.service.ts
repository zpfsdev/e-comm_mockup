import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        username: true,
        email: true,
        contactNumber: true,
        profilePictureUrl: true,
        dateOfBirth: true,
        dateTimeRegistered: true,
        lastLogin: true,
        status: true,
        userRoles: { include: { role: true } },
        userAddresses: {
          include: {
            address: {
              include: {
                barangay: {
                  include: { city: { include: { province: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  async updateProfile(id: number, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        username: true,
        email: true,
        contactNumber: true,
        profilePictureUrl: true,
      },
    });
  }
}
