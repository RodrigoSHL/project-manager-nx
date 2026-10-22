import { ConfigService } from '@nestjs/config';

// Keep configuration tests independent of the developer's environment and .env.
export function testConfig(values: Record<string, unknown>): ConfigService {
  return { get: (key: string) => values[key] } as ConfigService;
}
