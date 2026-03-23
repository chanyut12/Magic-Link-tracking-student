import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    if (!hashedPassword) return false;
    
    if (this.isPlainText(hashedPassword)) {
      return plainPassword === hashedPassword;
    }
    
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private isPlainText(password: string): boolean {
    return !password.startsWith('$2b$') && !password.startsWith('$2a$');
  }

  async needsHashing(password: string): Promise<boolean> {
    return this.isPlainText(password);
  }
}
