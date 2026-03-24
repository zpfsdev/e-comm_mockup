import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Get all provinces' })
  getProvinces() {
    return this.locationsService.getProvinces();
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get cities in a province' })
  getCities(@Query('provinceId', ParseIntPipe) provinceId: number) {
    return this.locationsService.getCities(provinceId);
  }

  @Get('barangays')
  @ApiOperation({ summary: 'Get barangays in a city' })
  getBarangays(@Query('cityId', ParseIntPipe) cityId: number) {
    return this.locationsService.getBarangays(cityId);
  }
}
