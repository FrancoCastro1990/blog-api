import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  mongoUri: string;
  nodeEnv: string;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://root:example@localhost:27017/posts_db?authSource=admin',
  nodeEnv: process.env.NODE_ENV || 'development',
};