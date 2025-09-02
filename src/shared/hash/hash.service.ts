import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashService {
  private static SALT_ROUNDS = 10;

  compare(plainData: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(plainData, encrypted);
  }

  hash(data: string): Promise<string> {
    return bcrypt.hash(data, HashService.SALT_ROUNDS);
  }
}
