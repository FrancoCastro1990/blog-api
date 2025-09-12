import bcrypt from 'bcryptjs';
import { config } from '../../config';

export class PasswordService {
  /**
   * Hash a plain text password using bcrypt
   * @param plainPassword - The plain text password to hash
   * @returns Promise<string> - The hashed password
   */
  async hash(plainPassword: string): Promise<string> {
    try {
      const saltRounds = config.auth.bcryptRounds;
      return await bcrypt.hash(plainPassword, saltRounds);
    } catch (error) {
      throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Verify a plain text password against a hashed password
   * @param plainPassword - The plain text password to verify
   * @param hashedPassword - The hashed password to compare against
   * @returns Promise<boolean> - True if the password matches, false otherwise
   */
  async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error(`Failed to verify password: ${error instanceof Error ? error.message : 'Invalid hash format'}`);
    }
  }
}