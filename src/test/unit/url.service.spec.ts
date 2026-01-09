import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UrlService } from 'modules/url/url.service';
import { Url } from 'entities/url.entity';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';

describe('UrlService', () => {
    let service: UrlService;
    let urlRepository: Partial<Repository<Url>>;

    beforeEach(async () => {
        urlRepository = {
            exists: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            increment: jest.fn(),
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UrlService,
                {
                    provide: getRepositoryToken(Url),
                    useValue: urlRepository,
                },
            ],
        }).compile();

        service = module.get<UrlService>(UrlService);
        urlRepository = module.get(getRepositoryToken(Url));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('shorten()', () => {
        it('should reject invalid URL', async () => {
            await expect(
                service.shorten({ originalUrl: 'invalid-url' } as any),
            ).rejects.toBeInstanceOf(BadRequestException);
        });
        it('should create random short url', async () => {
            (urlRepository.exists as jest.Mock).mockResolvedValue(false);
            (urlRepository.save as jest.Mock).mockResolvedValue({ shortCode: 'ABC123' } as any);

            const result = await service.shorten({ originalUrl: 'https://google.com' });

            expect(urlRepository.save).toHaveBeenCalled();
            expect(result.shortCode).toBeDefined();
        });

        it('should create with alias when authenticated', async () => {
            (urlRepository.exists as jest.Mock).mockResolvedValue(false);
            (urlRepository.save as jest.Mock).mockResolvedValue({ shortCode: 'alias1' } as any);

            const result = await service.shorten(
                { originalUrl: 'https://google.com', alias: 'alias1' },
                { id: 'user-1' } as any,
            );

            expect(result.shortCode).toBe('alias1');
        });

        it('should throw conflict when alias exists', async () => {
            (urlRepository.exists as jest.Mock).mockResolvedValue(true);

            await expect(
                service.shorten(
                    { originalUrl: 'https://google.com', alias: 'taken' },
                    { id: 'user-1' } as any,
                ),
            ).rejects.toBeInstanceOf(InternalServerErrorException);
        });
    })

    describe('findAllByUser()', () => {
        it('find URL and return all by user', async () => {
            (urlRepository.find as jest.Mock).mockResolvedValue([{ id: 'id01' }, { id: 'id02' }]);

            const urls = await service.findAllByUser('user010101');

            expect(urls.length).toBe(2);
        });
    });

    describe('findOne()', () => {
        it('find URL and return if exists', async () => {
            (urlRepository.findOneBy as jest.Mock).mockResolvedValue({ id: '1' });

            const url = await service.findOne('1')

            expect(url.id).toBe('1');
        });

        it('set error if not exists', async () => {
            (urlRepository.findOneBy as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
        });

        it('set other error if not exists', async () => {
            (urlRepository.findOneBy as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne('88888')).rejects.toThrow(
                'The item with the specified ID was not found',
            );
        });
    });

    describe('updateIfOwner', () => {
        it('should update if owner', async () => {
            (urlRepository.findOne as jest.Mock).mockResolvedValue({
                shortCode: 'test',
                user: { id: 'user-1' },
            } as any);

            (urlRepository.save as jest.Mock).mockResolvedValue({ shortCode: 'test', originalUrl: 'new' } as any);

            const result = await service.updateIfOwner(
                'test',
                { originalUrl: 'new' } as any,
                'user-1',
            );

            expect(result.originalUrl).toBe('new');
        });

        it('should block update if not owner', async () => {
            (urlRepository.findOne as jest.Mock).mockResolvedValue({
                shortCode: 'test',
                user: { id: 'other-user' },
            } as any);

            await expect(
                service.updateIfOwner('test', {} as any, 'user-1'),
            ).rejects.toBeInstanceOf(InternalServerErrorException);
        });
    })

    describe('deleteIfOwner', () => {
        it('should soft delete if owner', async () => {
            const url = { shortCode: 'test', user: { id: 'user-1' } } as any;

            (urlRepository.findOne as jest.Mock).mockResolvedValue(url);
            (urlRepository.save as jest.Mock).mockResolvedValue(url);

            const result = await service.deleteIfOwner('test', 'user-1');

            expect(result.success).toBe(true);
            expect(urlRepository.save).toHaveBeenCalled();
        });
    })

    describe('redirectShort()', () => {
        it('should redirect and increment counter', async () => {
            (urlRepository.findOne as jest.Mock).mockResolvedValue({
                id: '1',
                shortCode: 'test',
                originalUrl: 'https://google.com',
            } as any);

            const result = await service.redirectShort('test');

            expect(result).toBe('https://google.com');
            expect(urlRepository.increment).toHaveBeenCalledWith(
                { id: '1' },
                'accessCount',
                1,
            );
        });

        it('should throw if short not found', async () => {
            (urlRepository.findOne as jest.Mock).mockResolvedValue(null);

            await expect(service.redirectShort('x')).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    })
});