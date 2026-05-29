import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { RequestLogQueryDto } from '../dto/request-log-query.dto';
import { RequestLogsService } from '../services/request-logs.service';

@ApiBearerAuth()
@ApiTags('Request Logs')
@Permissions('request-logs.read')
@Controller('request-logs')
export class RequestLogsController {
  constructor(private readonly requestLogsService: RequestLogsService) {}

  @Get()
  findAll(@Query() query: RequestLogQueryDto) {
    return this.requestLogsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requestLogsService.findOne(id);
  }
}
