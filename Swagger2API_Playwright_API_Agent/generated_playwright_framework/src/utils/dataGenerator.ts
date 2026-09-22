import { RandomUtils } from './randomUtils';

/**
 * Dynamic Mock Data Generator
 */
export class DataGenerator {
  static randomString(prefix: string = 'test'): string {
    return `${prefix}_${RandomUtils.randomString(6)}`;
  }

  static randomNumber(min: number = 1, max: number = 1000): number {
    return RandomUtils.randomNumber(min, max);
  }

  static randomEmail(): string {
    return `qa.user.${Date.now()}@example.com`;
  }
}
