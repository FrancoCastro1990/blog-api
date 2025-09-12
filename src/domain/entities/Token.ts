import { Permission } from './User';

/**
 * JWT Token payload structure
 */
export interface TokenPayload {
  /**
   * User ID
   */
  userId: string;

  /**
   * User's email
   */
  email: string;

  /**
   * Array of user permissions
   */
  permissions: Permission[];

  /**
   * Token type - determines what operations are allowed
   */
  type: TokenType;

  /**
   * Issued at timestamp (Unix timestamp)
   */
  iat: number;

  /**
   * Expiration timestamp (Unix timestamp)
   */
  exp: number;
}

/**
 * Types of tokens in the system
 */
export enum TokenType {
  ACCESS = 'access',    // For read operations (GET posts)
  ADMIN = 'admin',      // For write operations (CREATE posts)  
  REFRESH = 'refresh'   // For token renewal
}

/**
 * Token pair returned after authentication
 */
export interface TokenPair {
  /**
   * Access token for read operations
   */
  accessToken: string;

  /**
   * Admin token for write operations (if user has permissions)
   */
  adminToken?: string;

  /**
   * Refresh token for renewing other tokens
   */
  refreshToken: string;
}

/**
 * Complete authentication response
 */
export interface AuthResponse {
  /**
   * User information (without sensitive data)
   */
  user: {
    id: string;
    email: string;
    permissions: Permission[];
  };

  /**
   * Access token for API operations
   */
  accessToken: string;

  /**
   * Refresh token for renewing access tokens
   */
  refreshToken: string;

  /**
   * Admin token (optional, only for admin users)
   */
  adminToken?: string;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}