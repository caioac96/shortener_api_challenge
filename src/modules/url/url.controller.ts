import { Body, Controller, Delete, Get, Param, Post, Put, Redirect, Res, UseGuards } from '@nestjs/common';
import { UrlService } from './url.service';
import { UpdateUrlDto } from './dtos/update-url.dto';
import { OptionalAuthGuard } from 'modules/auth/optional-auth.guard';
import { ShortenUrlDto } from './dtos/shorten-url.dto';
import { CurrentUser } from 'decorators/current-user.decorator';
import { User } from 'entities/users.entity';
import { JwtAuthGuard } from 'modules/auth/auth.guard';

@Controller('url')
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
  getUrls(@CurrentUser() user: User) {
    return this.urlService.findAllByUser(user.id);
  }

  @Put('my-urls/:id')
  @UseGuards(JwtAuthGuard)
  updateUrl(
    @Param('id') id: string,
    @Body() dto: UpdateUrlDto,
    @CurrentUser() user: User,
  ) {
    return this.urlService.updateIfOwner(id, dto, user.id);
  }

  @Delete('my-urls/:id')
  @UseGuards(JwtAuthGuard)
  deleteUrl(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.urlService.deleteIfOwner(id, user.id);
  }

  @Get(':short')
  @Redirect()
  async redirectShort(@Param('short') short: string) {
    const url = await this.urlService.redirectShort(short);

    return {
      url,
      statusCode: 302,
    };
  }
}
