import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

const PASSWORD_SALT_ROUNDS = 12;

@Injectable()
export class PasswordService {
  hash(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
