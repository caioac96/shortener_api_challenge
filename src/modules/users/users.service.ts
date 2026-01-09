import * as bcrypt from 'bcryptjs';
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "entities/users.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dtos/create-user.dto";
import { log } from 'utils/logger.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  async create(dto: CreateUserDto) {
    try {
      const exists = await this.usersRepository.findOne({
        where: { mail: dto.mail },
      });

      if (exists) {
        throw new ConflictException('Email already in use');
      }

      const hash = await bcrypt.hash(dto.password, 10);

      const user = this.usersRepository.create({
        ...dto,
        password: hash,
      });

      log("User created!");

      return this.usersRepository.save(user);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('There was a problem creating the user');
    }
  }

  async findAll() {
    try {
      return await this.usersRepository.find();
    } catch (error) {
      throw new InternalServerErrorException('There was a problem searching for the user');
    }
  }

  async findOne(id: string) {
    try {
      const retFind = await this.usersRepository.findOneBy({ id });
      if (!retFind)
        throw new NotFoundException('The item with the specified ID was not found');
      return retFind;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('There was a problem searching for the user');
    }
  }

  findByMail(mail: string) {
    return this.usersRepository.findOne({ where: { mail } });
  }
}