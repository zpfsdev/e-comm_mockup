import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface UserProfileDto {
  readonly id: number;
  readonly firstName: string;
  readonly middleName: string | null;
  readonly lastName: string;
  readonly username: string;
  readonly email: string;
  readonly contactNumber: string | null;
  readonly profilePictureUrl: string | null;
  readonly dateOfBirth: Date | null;
  readonly dateTimeRegistered: Date;
  readonly lastLogin: Date | null;
  readonly status: string;
  readonly userRoles: Array<{ role: { roleName: string } }>;
  readonly userAddresses: Array<{
    address: {
      barangay: { barangayName: string; city: { cityName: string; province: { provinceName: string } } };
    };
  }>;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UserProfileDto> {
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
