import { Controller, Get } from '@nestjs/common';
import { Public } from '../core/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @Public()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
