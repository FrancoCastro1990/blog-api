import { UserRepository } from '@domain/repositories/UserRepository';
import { User } from '@domain/entities/User';
import { UserModel, UserDocument } from '@infrastructure/database/MongooseUserModel';
import { logger } from '@utils/logger';

export class MongooseUserRepository implements UserRepository {
  /**
   * Create a new user
   */
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const userDoc = UserModel.fromDomainEntity(userData);
      const savedUser = await userDoc.save();
      
      logger.info('User created successfully', { 
        userId: (savedUser._id as any).toString(),
        email: savedUser.email 
      });
      
      return savedUser.toDomainEntity();
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new Error(`User with email ${userData.email} already exists`);
      }
      logger.error('Failed to create user', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to create user');
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const userDoc = await UserModel.findById(id).exec();
      return userDoc ? userDoc.toDomainEntity() : null;
    } catch (error) {
      logger.error('Failed to find user by ID', { 
        userId: id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const userDoc = await UserModel.findOne({ email: email.toLowerCase() }).exec();
      return userDoc ? userDoc.toDomainEntity() : null;
    } catch (error) {
      logger.error('Failed to find user by email', { 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return null;
    }
  }

  /**
   * Update user data
   */
  async update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    try {
      const userDoc = await UserModel.findByIdAndUpdate(
        id,
        { 
          ...updates,
          updatedAt: new Date()
        },
        { 
          new: true, // Return updated document
          runValidators: true // Run schema validators
        }
      ).exec();
      
      if (userDoc) {
        logger.info('User updated successfully', { userId: id });
        return userDoc.toDomainEntity();
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to update user', { 
        userId: id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to update user');
    }
  }

  /**
   * Delete user by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await UserModel.findByIdAndDelete(id).exec();
      if (result) {
        logger.info('User deleted successfully', { userId: id });
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Failed to delete user', { 
        userId: id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    try {
      const count = await UserModel.countDocuments({ email: email.toLowerCase() }).exec();
      return count > 0;
    } catch (error) {
      logger.error('Failed to check user existence by email', { 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Add refresh token to user
   */
  async addRefreshToken(userId: string, tokenData: { token: string; expiresAt: Date }): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $push: { 
            refreshTokens: {
              token: tokenData.token,
              expiresAt: tokenData.expiresAt,
              createdAt: new Date()
            }
          },
          $set: { updatedAt: new Date() }
        },
        { runValidators: true }
      ).exec();
      
      logger.info('Refresh token added to user', { userId });
    } catch (error) {
      logger.error('Failed to add refresh token', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to add refresh token');
    }
  }

  /**
   * Remove refresh token from user
   */
  async removeRefreshToken(userId: string, token: string): Promise<void> {
    try {
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $pull: { refreshTokens: { token } },
          $set: { updatedAt: new Date() }
        }
      ).exec();
      
      logger.info('Refresh token removed from user', { userId });
    } catch (error) {
      logger.error('Failed to remove refresh token', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to remove refresh token');
    }
  }

  /**
   * Clean expired refresh tokens for user
   */
  async cleanExpiredTokens(userId: string): Promise<void> {
    try {
      const now = new Date();
      await UserModel.findByIdAndUpdate(
        userId,
        {
          $pull: { refreshTokens: { expiresAt: { $lt: now } } },
          $set: { updatedAt: new Date() }
        }
      ).exec();
      
      logger.info('Expired tokens cleaned for user', { userId });
    } catch (error) {
      logger.error('Failed to clean expired tokens', { 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Failed to clean expired tokens');
    }
  }
}