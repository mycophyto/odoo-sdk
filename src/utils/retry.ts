export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export class RetryManager {
  private defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryCondition: (error: any) => {
      if (typeof error === 'object' && error !== null) {
        if ('faultCode' in error) {
          const faultCode = error.faultCode;
          return faultCode === 1 || faultCode === 2;
        }
        if ('code' in error) {
          return error.code === 'ECONNRESET' || 
                 error.code === 'ENOTFOUND' || 
                 error.code === 'ETIMEDOUT';
        }
      }
      return false;
    }
  };

  async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: any;
    let delay = config.baseDelay;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === config.maxAttempts) {
          throw error;
        }

        if (!config.retryCondition(error)) {
          throw error;
        }

        await this.sleep(delay);
        delay = Math.min(delay * config.backoffFactor, config.maxDelay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const defaultRetryManager = new RetryManager();