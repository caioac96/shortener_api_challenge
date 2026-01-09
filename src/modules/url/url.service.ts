import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Url } from 'entities/url.entity';
import { IsNull, Repository } from 'typeorm';
import { ShortenUrlDto } from './dtos/shorten-url.dto';
import { User } from 'entities/users.entity';
import { UpdateUrlDto } from './dtos/update-url.dto';
import { log } from 'utils/logger.util';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
  ) { }

  async shorten(dto: ShortenUrlDto, user?: User | null) {
    try {
      if (!this.isValidUrl(dto.originalUrl)) {
        throw new BadRequestException('Invalid URL');
      }

      if (user && dto.alias) {
        return this.createWithAlias(dto.originalUrl, dto.alias, user.id);
      }

      return this.createRandomSlug(dto.originalUrl, user?.id);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('There was a problem in generate shorten slug');
    }
  }

  private async createRandomSlug(originalUrl: string, userId?: string) {
    try {
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

      log(`Random Slug created to URL: ${originalUrl}`);

      return this.urlRepository.save({
        originalUrl,
        shortCode: slug,
        userId: userId ?? null,
        accessCount: 0,
      });
    } catch (error) {
      throw new InternalServerErrorException('There was a problem creating the random shortCode');
    }
  }

  private async createWithAlias(
    originalUrl: string,
    alias: string,
    userId: string,
  ) {
    try {
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

      const retSave = this.urlRepository.save({
        originalUrl,
        shortCode: normalized,
        userId,
        accessCount: 0,
      });

      log(`Slug created to URL: ${originalUrl} with alias: ${alias}`);
      return retSave;
    } catch (error) {
      throw new InternalServerErrorException('There was a problem creating the shortCode with alias');
    }
  }

  async findOne(id: string) {
    try {
      const retFind = await this.urlRepository.findOneBy({ id });
      if (!retFind)
        throw new NotFoundException('The item with the specified ID was not found');
      return retFind;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('There was a problem searching for the URL');
    }
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
    try {
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
      const retUpdate = this.urlRepository.save(url);

      log(`Slug updated: ${shortCode}`);
      return retUpdate;
    } catch (error) {
      throw new InternalServerErrorException('There was a problem updating the shortCode');
    }
  }

  async deleteIfOwner(shortCode: string, userId: string) {
    try {
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
      const retDelete = await this.urlRepository.save(url);

      if (!retDelete) throw log(`Slug NOT deleted: ${shortCode}`);

      log(`Slug deleted: ${shortCode}`);
      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException('There was a problem deleting the shortCode');
    }
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