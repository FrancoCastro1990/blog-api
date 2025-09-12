/**
 * User entity representing a user in the system
 */
export interface User {
  /**
   * Unique identifier for the user
   */
  id: string;

  /**
   * User's email address (unique)
   */
  email: string;

  /**
   * Hashed password using bcrypt
   */
  passwordHash: string;

  /**
   * Array of permissions granted to the user
   */
  permissions: Permission[];

  /**
   * Active refresh tokens for the user
   */
  refreshTokens: RefreshTokenData[];

  /**
   * Timestamp when the user was created
   */
  createdAt: Date;

  /**
   * Timestamp when the user was last updated
   */
  updatedAt: Date;
}

/**
 * Available permissions in the system
 */
export enum Permission {
  READ_POSTS = 'read:posts',
  CREATE_POSTS = 'create:posts',
  ADMIN = 'admin'
}

/**
 * Refresh token data stored with the user
 */
export interface RefreshTokenData {
  /**
   * The refresh token string
   */
  token: string;

  /**
   * When this token expires
   */
  expiresAt: Date;

  /**
   * When this token was created
   */
  createdAt: Date;
}

/**
 * User creation input data
 */
export interface CreateUserData {
  email: string;
  password: string;
  permissions: Permission[];
}

/**
 * User authentication data for login
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * User data returned after successful authentication (without sensitive info)
 */
export interface UserResponse {
  id: string;
  email: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}