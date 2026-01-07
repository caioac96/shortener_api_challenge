import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller()
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('my-urls')
    getUrls(): string {
        return this.userService.getUrls();
    }
}
