import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    const userAddresses = await this.prisma.userAddress.findMany({
      where: { userId },
      include: {
        user: true,
        address: {
          include: {
            barangay: {
              include: {
                city: {
                  include: {
                    province: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return userAddresses.map(ua => ({
      id: ua.id,
      fullName: ua.recipientName || (ua.user?.firstName + ' ' + (ua.user?.lastName || '')),
      phoneNumber: ua.phoneNumber || ua.user?.contactNumber || '',
      detailedAddress: ua.address.street,
      barangay: ua.address.barangay.barangay,
      city: ua.address.barangay.city.city,
      province: ua.address.barangay.city.province.province,
      barangayId: ua.address.barangay.id,
      cityId: ua.address.barangay.city.id,
      provinceId: ua.address.barangay.city.province.id,
      region: 'Albay',
      addressType: ua.addressType,
      isDefault: ua.isDefault
    }));
  }

  async create(userId: number, dto: CreateAddressDto) {
    // Find established locations to ensure data integrity
    const province = await this.prisma.province.findFirst({
      where: { province: { contains: 'Albay' } }
    });

    if (!province) throw new NotFoundException('Province Albay not found in system');

    const city = await this.prisma.city.findFirst({
      where: { city: dto.city, provinceId: province.id }
    });

    if (!city) throw new NotFoundException(`City ${dto.city} not found in province ${province.province}`);

    const barangay = await this.prisma.barangay.findFirst({
      where: { barangay: dto.barangay, cityId: city.id }
    });

    if (!barangay) throw new NotFoundException(`Barangay ${dto.barangay} not found in city ${city.city}`);

    const address = await this.prisma.address.upsert({
      where: { street_barangayId: { street: dto.detailedAddress, barangayId: barangay.id } },
      update: {},
      create: { street: dto.detailedAddress, barangayId: barangay.id }
    });

    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    return this.prisma.userAddress.create({
      data: {
        userId,
        addressId: address.id,
        addressType: dto.addressType,
        isDefault: dto.isDefault ?? false,
        recipientName: dto.fullName,
        phoneNumber: dto.phoneNumber
      }
    });
  }

  async update(userId: number, id: number, dto: UpdateAddressDto) {
    const userAddress = await this.prisma.userAddress.findUnique({
      where: { id, userId }
    });

    if (!userAddress) throw new NotFoundException('Address not found');

    // Find established locations to ensure data integrity
    const province = await this.prisma.province.findFirst({
      where: { province: { contains: 'Albay' } }
    });

    if (!province) throw new NotFoundException('Province Albay not found in system');

    const city = await this.prisma.city.findFirst({
      where: { city: dto.city, provinceId: province.id }
    });

    if (!city) throw new NotFoundException(`City ${dto.city} not found in province ${province.province}`);

    const barangay = await this.prisma.barangay.findFirst({
      where: { barangay: dto.barangay, cityId: city.id }
    });

    if (!barangay) throw new NotFoundException(`Barangay ${dto.barangay} not found in city ${city.city}`);

    const address = await this.prisma.address.upsert({
      where: { street_barangayId: { street: dto.detailedAddress, barangayId: barangay.id } },
      update: {},
      create: { street: dto.detailedAddress, barangayId: barangay.id }
    });

    if (dto.isDefault) {
      await this.prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    return this.prisma.userAddress.update({
      where: { id },
      data: {
        addressId: address.id,
        addressType: dto.addressType,
        isDefault: dto.isDefault ?? false,
        recipientName: dto.fullName,
        phoneNumber: dto.phoneNumber
      }
    });
  }

  async remove(userId: number, id: number) {
    const userAddress = await this.prisma.userAddress.findUnique({
      where: { id, userId }
    });

    if (!userAddress) throw new NotFoundException('Address not found');

    return this.prisma.userAddress.delete({
      where: { id }
    });
  }

  async setDefault(userId: number, id: number) {
    const userAddress = await this.prisma.userAddress.findUnique({
      where: { id, userId }
    });

    if (!userAddress) throw new NotFoundException('Address not found');

    await this.prisma.userAddress.updateMany({
      where: { userId },
      data: { isDefault: false }
    });

    return this.prisma.userAddress.update({
      where: { id },
      data: { isDefault: true }
    });
  }
}
