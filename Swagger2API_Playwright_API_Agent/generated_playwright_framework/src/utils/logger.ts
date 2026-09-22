/**
 * Centralized Framework Logger with Automated Sensitive Data Masking
 */
export class Logger {
  private static sanitize(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => Logger.sanitize(item));
    const redacted: any = {};
    const SENSITIVE_KEYS = /token|auth|password|secret|key|jwt|authorization|credential/i;
    for (const [key, val] of Object.entries(obj)) {
      if (key === 'tokenConsumed' && typeof val === 'string') {
        redacted[key] = val;
      } else if (SENSITIVE_KEYS.test(key)) {
        redacted[key] = '***REDACTED***';
      } else if (val && typeof val === 'object') {
        redacted[key] = Logger.sanitize(val);
      } else {
        redacted[key] = val;
      }
    }
    return redacted;
  }

  static info(message: string, context?: any) {
    console.log(`[INFO] ${message}`, context ? JSON.stringify(Logger.sanitize(context)) : '');
  }

  static error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error || '');
  }

  static request(method: string, url: string, data?: any) {
    console.log(`[REQ] -> ${method.toUpperCase()} ${url}`, data ? JSON.stringify(Logger.sanitize(data)) : '');
  }

  static response(method: string, url: string, status: number) {
    console.log(`[RES] <- ${status} ${method.toUpperCase()} ${url}`);
  }

  static apiTrace(trace: any) {
    console.log(`[API_TRACE] ${JSON.stringify(Logger.sanitize(trace))}`);
  }
}
