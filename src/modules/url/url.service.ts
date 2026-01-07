import { Injectable } from '@nestjs/common';

@Injectable()
export class UrlService {
  shortenUrl(): string {
    return 'Hello World!';
  }

  getUrls(): string {
    return 'Hello World!';
  }

  updateUrl(id): string {
    return `Hello World! ${id}`;
  }

  deleteUrl(): string {
    return 'Hello World!';
  }

  redirectShort(): string {
    return 'Hello World!';
  }
}