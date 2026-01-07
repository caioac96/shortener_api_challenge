import * as bcrypt from 'bcryptjs';
import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "entities/users.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dtos/create-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
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

    return this.usersRepository.save(user);
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }
}