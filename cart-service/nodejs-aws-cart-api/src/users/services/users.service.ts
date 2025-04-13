import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// import { randomUUID } from 'node:crypto';
// import { User } from '../models';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  //private readonly users: Record<string, User>;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // findOne(name: string): User {
  //   for (const id in this.users) {
  //     if (this.users[id].name === name) {
  //       return this.users[id];
  //     }
  //   }
  //   return;
  // }

  async findOne(name: string): Promise<User | undefined> {
    return await this.userRepository.findOne({
      where: { name },
      // relations: ['carts', 'orders'],
    });
  }

  // createOne({ name, password }: User): User {
  //   const id = randomUUID();
  //   const newUser = { id, name, password };

  //   this.users[id] = newUser;

  //   return newUser;
  // }
  async createOne({ name, email, password }: Partial<User>): Promise<User> {
    console.log(name, email, password);
    const newUser = this.userRepository.create({ name, email, password });

    return this.userRepository.save(newUser);
  }
}
