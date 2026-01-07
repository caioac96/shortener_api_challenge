import { IsOptional, IsUrl, Matches } from "class-validator";

export class ShortenUrlDto {
    @IsUrl({ require_protocol: true })
    originalUrl: string;

    @IsOptional()
    @Matches(/^[a-z0-9_-]{3,30}$/)
    alias?: string;
}