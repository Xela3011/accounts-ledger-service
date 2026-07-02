type Environment = Record<string, string | undefined>;

const numericVariables = ['PORT', 'DB_PORT', 'REDIS_PORT'];
const logLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];

export function validateEnvironment(config: Environment): Environment {
  for (const variable of numericVariables) {
    const value = config[variable];
    if (value !== undefined && Number.isNaN(Number(value))) {
      throw new Error(`${variable} must be a number`);
    }
  }

  if (config.NODE_ENV === 'production' && !config.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
  }

  if (config.LOG_LEVEL !== undefined && !logLevels.includes(config.LOG_LEVEL)) {
    throw new Error(`LOG_LEVEL must be one of: ${logLevels.join(', ')}`);
  }

  return config;
}
