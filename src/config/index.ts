import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  mongoUri: string;
  nodeEnv: string;
  auth: {
    jwtSecret: string;
    accessTokenExpiry: string;
    adminTokenExpiry: string;
    refreshTokenExpiry: string;
    bcryptRounds: number;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://root:example@localhost:27017/posts_db?authSource=admin',
  nodeEnv: process.env.NODE_ENV || 'development',
  auth: {
    jwtSecret: process.env.AUTH_JWT_SECRET || 'your-super-secret-jwt-key-256-bits-long',
    accessTokenExpiry: process.env.AUTH_ACCESS_TOKEN_EXPIRY || '15m',
    adminTokenExpiry: process.env.AUTH_ADMIN_TOKEN_EXPIRY || '1h',
    refreshTokenExpiry: process.env.AUTH_REFRESH_TOKEN_EXPIRY || '7d',
    bcryptRounds: parseInt(process.env.AUTH_BCRYPT_ROUNDS || '12', 10),
  },
};