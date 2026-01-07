import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Url } from 'entities/url.entity';
import { IsNull, Repository } from 'typeorm';
import { ShortenUrlDto } from './dtos/shorten-url.dto';
import { User } from 'entities/users.entity';
import { Response as ResponseFromExpress } from 'express';
import { UpdateUrlDto } from './dtos/update-url.dto';

@Injectable()
export class UrlService {
  constructor( 
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
  ) {}

  async shorten(dto: ShortenUrlDto, user?: User | null) {
    if (user && dto.alias) {
      return this.createWithAlias(dto.originalUrl, dto.alias, user.id);
    }

    return this.createRandomSlug(dto.originalUrl);
  }

  async createRandomSlug(originalUrl: string) {
    if (!this.isValidUrl(originalUrl)) throw BadRequestException;

    let slug: string;
    let attempts = 0;

    do {
      slug = this.generateRandomSlug();
      attempts++;
    } while (
      await this.urlRepository.exists({ where: { shortCode: slug } }) && attempts < 5
    );

    if (attempts === 5) throw InternalServerErrorException;

    return this.urlRepository.save({
      originalUrl,
      shortCode: slug,
      accessCount: 0,
    });
  }

  async createWithAlias(originalUrl: string, alias: string, userId: string) {
    if (!this.isValidUrl(originalUrl)) throw BadRequestException;

    const normalized = alias.toLowerCase();

    if (!/^[a-z0-9_-]{3,30}$/.test(normalized))
      throw BadRequestException;

    const exists = await this.urlRepository.exists({ where: { shortCode: normalized } });

    if (exists) throw ConflictException;

    return this.urlRepository.save({
      originalUrl,
      shortCode: normalized,
      userId,
      accessCount: 0,
    });
  }

  async findAll() {
    try {
      return await this.urlRepository.find();
    } catch (error) {
      throw new NotFoundException();
    }
  }

  async updateUrl(shortCode: string, dto: UpdateUrlDto) {
    const url = await this.urlRepository.findOne({
      where: {
        shortCode,
        deletedAt: IsNull(),
      },
    });

    if (!url) {
      throw new NotFoundException('URL not found');
    }

    Object.assign(url, dto);

    return this.urlRepository.save(url);
  }


  async deleteUrl(shortCode: string) {
    const result = await this.urlRepository.update(
      { shortCode, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );

    if (result.affected === 0) {
      throw new NotFoundException('URL not found');
    }

    return { success: true };
  }

  async redirectShort(short: string, res: ResponseFromExpress) {
    const url = await this.urlRepository.findOne({
      where: {
        shortCode: short,
        deletedAt: IsNull(),
      },
    });

    if (!url) throw new NotFoundException();

    await this.urlRepository.increment(
      { id: url.id },
      'accessCount',
      1,
    );

    return res.redirect(302, url.originalUrl);
  }

  private isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  private generateRandomSlug(): string {
    try {
      const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      const length = 6;

      const bytes = randomBytes(length);
      let result = '';

      for (let i = 0; i < length; i++) {
        result += alphabet[bytes[i] % alphabet.length];
      }

      return result;
    } catch (error) {
      throw new InternalServerErrorException('There was a problem generating random slug');
    }
  }
}