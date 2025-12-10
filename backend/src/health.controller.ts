import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
  }

  @Get('db')
  async checkDatabase() {
    // 可以在這裡加入資料庫連線檢查
    return {
      status: 'ok',
      message: 'Database connection check not implemented yet',
    };
  }
}
