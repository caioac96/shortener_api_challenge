import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { UrlService } from './url.service';
import { UpdateUrlDto } from './dtos/update-url.dto';
import { OptionalAuthGuard } from 'guards/optional-auth.guard';
import { ShortenUrlDto } from './dtos/shorten-url.dto';
import { CurrentUser } from 'decorators/current-user.decorator';
import { User } from 'entities/users.entity';
import { JwtAuthGuard } from 'guards/auth.guard';

@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) { }

  @Post('shorten')
  @UseGuards(OptionalAuthGuard)
  shortenUrl(
    @Body() dto: ShortenUrlDto,
    @CurrentUser() user: User | null,
  ) {
    return this.urlService.shorten(dto, user);
  }

  @Get('my-urls')
  @UseGuards(JwtAuthGuard)
  getUrls() {
    return this.urlService.findAll();
  }

  @Put('my-urls/:id')
  @UseGuards(JwtAuthGuard)
  updateUrl(@Param('id') id: string, @Body() updateUrlDto: UpdateUrlDto) {
    return this.urlService.updateUrl(id, updateUrlDto);
  }

  @Delete('my-urls/:id')
  @UseGuards(JwtAuthGuard)
  deleteUrl(@Param('id') id: string) {
    return this.urlService.deleteUrl(id);
  }

  @Get(':short')
  @UseGuards(JwtAuthGuard)
  redirectShort(@Param('short') short: string, @Req() req) {
    return this.urlService.redirectShort(short, req);
  }
}
