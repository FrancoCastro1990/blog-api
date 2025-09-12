import { User } from '../../../domain/entities/User';
import { AuthResponse } from '../../../domain/entities/Token';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { PasswordService, TokenService } from '../../../domain/services';
import { logger } from '../../../utils/logger';

export interface LoginUserRequest {
  email: string;
  password: string;
}

export class LoginUser {
  constructor(
    private userRepository: UserRepository,
    private passwordService: PasswordService,
    private tokenService: TokenService
  ) {}

  async execute(request: LoginUserRequest): Promise<AuthResponse> {
    const { email, password } = request;

    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Find user by email
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        logger.warn('Login attempt with non-existent email', { email });
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await this.passwordService.verify(password, user.passwordHash);
      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password', { userId: user.id, email });
        throw new Error('Invalid email or password');
      }

      // Clean expired refresh tokens
      await this.userRepository.cleanExpiredTokens(user.id);

      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken(user);
      const refreshToken = this.tokenService.generateRefreshToken(user);

      // Store refresh token
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await this.userRepository.addRefreshToken(user.id, {
        token: refreshToken,
        expiresAt: refreshTokenExpiry
      });

      logger.info('User logged in successfully', { 
        userId: user.id, 
        email: user.email,
        permissions: user.permissions
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          permissions: user.permissions
        },
        accessToken,
        refreshToken
      };

    } catch (error) {
      logger.error('Login failed', { 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}