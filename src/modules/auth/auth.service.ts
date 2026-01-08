import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "modules/users/users.service";

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private jwtService: JwtService
    ) { }

    async login(mail: string, password: string) {
        try {
            const user = await this.userService.findByMail(mail);

            if (!user || user.password !== password) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const payload = { sub: user.id, mail: user.mail };

            return {
                access_token: this.jwtService.sign(payload),
            };
        } catch (error) {
            throw new InternalServerErrorException(`Login failed to ${mail}`);
        }
    }
}
