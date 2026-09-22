import * as fs from 'fs';
import * as path from 'path';

/**
 * Safe File Reading / Writing Utilities for Test Data
 */
export class FileUtils {
  static readJson<T = any>(filePath: string): T {
    const raw = fs.readFileSync(path.resolve(filePath), 'utf-8');
    return JSON.parse(raw);
  }

  static writeJson(filePath: string, data: any): void {
    fs.writeFileSync(path.resolve(filePath), JSON.stringify(data, null, 2), 'utf-8');
  }
}
