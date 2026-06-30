type Environment = Record<string, string | undefined>;

const numericVariables = ['PORT', 'DB_PORT', 'REDIS_PORT'];

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

  return config;
}
