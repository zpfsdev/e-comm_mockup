import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getProvinces() {
    return this.prisma.province.findMany({
      orderBy: { province: 'asc' },
    });
  }

  async getCities(provinceId: number) {
    return this.prisma.city.findMany({
      where: { provinceId },
      orderBy: { city: 'asc' },
    });
  }

  async getBarangays(cityId: number) {
    return this.prisma.barangay.findMany({
      where: { cityId },
      orderBy: { barangay: 'asc' },
    });
  }
}
