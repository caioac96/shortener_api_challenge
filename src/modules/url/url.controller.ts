import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UrlService } from './url.service';
import { UpdateUrlDto } from './dtos/update-url.dto';

@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) { }

  @Post('shorten')
  shortenUrl(): string {
    return this.urlService.shortenUrl();
  }

  @Get('my-urls')
  getUrls(): string {
    return this.urlService.getUrls();
  }

  @Put('my-urls/:id')
  updateUrl(@Param('id') id: string, @Body() updateUrlDto: UpdateUrlDto) {
    return this.urlService.updateUrl(id);
  }

  @Delete('my-urls/:id')
  deleteUrl(): string {
    return this.urlService.deleteUrl();
  }

  @Get(':short')
  redirectShort(): string {
    return this.urlService.redirectShort();
  }
}
