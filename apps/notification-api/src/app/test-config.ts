import { ConfigService } from '@nestjs/config';

// Isolate tests from .env and from variables injected by Nx.
export function testConfig(values: Record<string, unknown>): ConfigService {
  return { get: (key: string) => values[key] } as ConfigService;
}
