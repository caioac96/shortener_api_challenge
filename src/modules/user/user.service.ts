import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
    getUrls(): string {
        return 'Hello World!';
    }
}