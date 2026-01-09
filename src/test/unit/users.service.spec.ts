import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { User } from 'entities/users.entity';
import { UsersService } from 'modules/users/users.service';

jest.mock('bcryptjs');

describe('UsersService', () => {
    let service: UsersService;
    let userRepository: Partial<Repository<User>>;

    beforeEach(async () => {
        userRepository = {
            findOne: jest.fn(),
            findOneBy: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
        };

        const module = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getRepositoryToken(User),
                    useValue: userRepository,
                },
            ],
        }).compile();

        service = module.get(UsersService);
    });

    describe('create()', () => {
        it('create user with hashed password', async () => {
            (userRepository.findOne as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            (userRepository.create as jest.Mock).mockReturnValue({
                mail: 'caio@mail.com',
                password: 'hashed-password',
            });
            (userRepository.save as jest.Mock).mockResolvedValue({
                id: '1',
                mail: 'caio@mail.com',
            });

            const user = await service.create({
                mail: 'caio@mail.com',
                password: '21091996',
                name: 'Caio',
            });

            expect(bcrypt.hash).toHaveBeenCalledWith('21091996', 10);
            expect(userRepository.create).toHaveBeenCalled();
            expect(user.mail).toBe('caio@mail.com');
        });

        it('set error if mail already exists', async () => {
            (userRepository.findOne as jest.Mock).mockResolvedValue({ id: '1' });

            await expect(
                service.create({
                    mail: 'caio@mail.com',
                    password: '21091996',
                    name: 'Caio',
                }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('findAll()', () => {
        it('find user and return all', async () => {
            (userRepository.find as jest.Mock).mockResolvedValue([{ id: '1' }]);

            const users = await service.findAll();

            expect(users.length).toBe(1);
        });
    });

    describe('findOne()', () => {
        it('find user and return if exists', async () => {
            (userRepository.findOneBy as jest.Mock).mockResolvedValue({ id: '1' });

            const user = await service.findOne('1')

            expect(user.id).toBe('1');
        });

        it('set error if not exists', async () => {
            (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);

            await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findByMail()', () => {
        it('find user by mail', async () => {
            (userRepository.findOne as jest.Mock).mockResolvedValue({ mail: "caio@mail.com" });

            const user = await service.findByMail('caio@mail.com')

            expect(user?.mail).toBe('caio@mail.com')
        })
    })
});