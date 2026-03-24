import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/decorators/public.decorator';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List all product categories' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('age-ranges')
  @Public()
  @ApiOperation({ summary: 'List all age ranges' })
  findAllAgeRanges() {
    return this.categoriesService.findAllAgeRanges();
  }

  @Get('test')
  @Public()
  @ApiOperation({ summary: 'Smoke test' })
  test(): { status: string } {
    return { status: 'categories module ok' };
  }
}
