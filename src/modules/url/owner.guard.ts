import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { UrlService } from "./url.service";

@Injectable()
export class OwnerGuard implements CanActivate {
    constructor(private readonly urlService: UrlService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const id = request.params.id;

        const url = await this.urlService.findOne(id);

        if (!url) {
            throw new NotFoundException('URL not found');
        }

        if (!url.user || url.user.id !== user.userId) {
            throw new ForbiddenException('You do not own this URL');
        }

        return true;
    }
}
