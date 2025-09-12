import { User } from '../entities';

export interface UserRepository {
  /**
   * Create a new user
   * @param user - User data to create
   * @returns Promise<User> - The created user
   */
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;

  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise<User | null> - The user or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   * @param email - User email
   * @returns Promise<User | null> - The user or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Update user data
   * @param id - User ID
   * @param updates - Partial user data to update
   * @returns Promise<User | null> - The updated user or null if not found
   */
  update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null>;

  /**
   * Delete user by ID
   * @param id - User ID
   * @returns Promise<boolean> - True if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Check if user exists by email
   * @param email - User email
   * @returns Promise<boolean> - True if exists, false otherwise
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Add refresh token to user
   * @param userId - User ID
   * @param tokenData - Refresh token data
   * @returns Promise<void>
   */
  addRefreshToken(userId: string, tokenData: { token: string; expiresAt: Date }): Promise<void>;

  /**
   * Remove refresh token from user
   * @param userId - User ID
   * @param token - Refresh token to remove
   * @returns Promise<void>
   */
  removeRefreshToken(userId: string, token: string): Promise<void>;

  /**
   * Clean expired refresh tokens for user
   * @param userId - User ID
   * @returns Promise<void>
   */
  cleanExpiredTokens(userId: string): Promise<void>;
}