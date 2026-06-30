import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findById(id);
  }
}
