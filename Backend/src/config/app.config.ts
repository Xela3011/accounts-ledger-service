import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  jwtSecret: process.env.JWT_SECRET ?? 'development-only-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
}));
