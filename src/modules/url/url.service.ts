import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Url } from 'entities/url.entity';
import { IsNull, Repository } from 'typeorm';
import { ShortenUrlDto } from './dtos/shorten-url.dto';
import { User } from 'entities/users.entity';
import { UpdateUrlDto } from './dtos/update-url.dto';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
  ) { }

  async shorten(dto: ShortenUrlDto, user?: User | null) {
    if (!this.isValidUrl(dto.originalUrl)) {
      throw new BadRequestException('Invalid URL');
    }

    if (user && dto.alias) {
      return this.createWithAlias(dto.originalUrl, dto.alias, user.id);
    }

    return this.createRandomSlug(dto.originalUrl, user?.id);
  }

  private async createRandomSlug(originalUrl: string, userId?: string) {
    let slug: string;
    let attempts = 0;

    do {
      slug = this.generateRandomSlug();
      attempts++;
    } while (
      await this.urlRepository.exists({ where: { shortCode: slug } }) &&
      attempts < 5
    );

    if (attempts === 5) {
      throw new InternalServerErrorException('Failed to generate unique slug');
    }

    return this.urlRepository.save({
      originalUrl,
      shortCode: slug,
      userId: userId ?? null,
      accessCount: 0,
    });
  }

  private async createWithAlias(
    originalUrl: string,
    alias: string,
    userId: string,
  ) {
    const normalized = alias.toLowerCase();

    if (!/^[a-z0-9_-]{3,30}$/.test(normalized)) {
      throw new BadRequestException('Invalid alias format');
    }

    const exists = await this.urlRepository.exists({
      where: { shortCode: normalized },
    });

    if (exists) {
      throw new ConflictException('Alias already in use');
    }

    return this.urlRepository.save({
      originalUrl,
      shortCode: normalized,
      userId,
      accessCount: 0,
    });
  }

  async findOne(id: string) {
    return this.urlRepository.findOneBy({ id: id });
  }

  async findAllByUser(userId: string) {
    return this.urlRepository.find({
      where: {
        user: { id: userId },
        deletedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async updateIfOwner(
    shortCode: string,
    dto: UpdateUrlDto,
    userId: string,
  ) {
    const url = await this.urlRepository.findOne({
      where: {
        shortCode,
        deletedAt: IsNull(),
      },
    });

    if (!url) {
      throw new NotFoundException('URL not found');
    }

    if (url.user?.id !== userId) {
      throw new ConflictException('You do not own this URL');
    }

    Object.assign(url, dto);

    return this.urlRepository.save(url);
  }

  async deleteIfOwner(shortCode: string, userId: string) {
    const url = await this.urlRepository.findOne({
      where: {
        shortCode,
        deletedAt: IsNull(),
      },
    });

    if (!url) {
      throw new NotFoundException('URL not found');
    }

    if (url.user?.id !== userId) {
      throw new ConflictException('You do not own this URL');
    }

    url.deletedAt = new Date();
    await this.urlRepository.save(url);

    return { success: true };
  }

  async redirectShort(short: string) {
    const url = await this.urlRepository.findOne({
      where: {
        shortCode: short,
        deletedAt: IsNull(),
      },
    });

    if (!url) {
      throw new NotFoundException('Short URL not found');
    }

    await this.urlRepository.increment({ id: url.id }, 'accessCount', 1);

    return url.originalUrl;
  }

  private isValidUrl(url: string) {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  private generateRandomSlug(): string {
    const alphabet =
      '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const length = 6;

    const bytes = randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      result += alphabet[bytes[i] % alphabet.length];
    }

    return result;
  }
}