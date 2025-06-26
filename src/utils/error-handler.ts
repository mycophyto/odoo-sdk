import { OdooResponse } from '../types';

export class OdooError extends Error {
  public readonly faultCode?: number;
  public readonly faultString?: string;
  public readonly originalError?: any;

  constructor(message: string, faultCode?: number, faultString?: string, originalError?: any) {
    super(message);
    this.name = 'OdooError';
    this.faultCode = faultCode;
    this.faultString = faultString;
    this.originalError = originalError;
  }
}

export class OdooAuthenticationError extends OdooError {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'OdooAuthenticationError';
  }
}

export class OdooConnectionError extends OdooError {
  constructor(message: string = 'Connection failed') {
    super(message);
    this.name = 'OdooConnectionError';
  }
}

export class OdooValidationError extends OdooError {
  public readonly validationErrors: string[];

  constructor(message: string, validationErrors: string[] = []) {
    super(message);
    this.name = 'OdooValidationError';
    this.validationErrors = validationErrors;
  }
}

export class ErrorHandler {
  static handleResponse<T>(response: OdooResponse<T>): T {
    if (response.success && response.data !== undefined) {
      return response.data;
    }

    if (response.faultCode !== undefined) {
      this.throwOdooError(response.faultCode, response.faultString || response.error || 'Unknown error');
    }

    throw new OdooError(response.error || 'Unknown error occurred');
  }

  static throwOdooError(faultCode: number, faultString: string): never {
    switch (faultCode) {
      case 1:
        throw new OdooConnectionError(`Connection error: ${faultString}`);
      case 2:
        throw new OdooAuthenticationError(`Authentication error: ${faultString}`);
      case 3:
        throw new OdooValidationError(`Validation error: ${faultString}`);
      default:
        throw new OdooError(`Odoo error (${faultCode}): ${faultString}`, faultCode, faultString);
    }
  }

  static createResponse<T>(data: T): OdooResponse<T> {
    return {
      success: true,
      data
    };
  }

  static createErrorResponse(error: any): OdooResponse {
    if (error instanceof OdooError) {
      return {
        success: false,
        error: error.message,
        faultCode: error.faultCode,
        faultString: error.faultString
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: false,
      error: String(error)
    };
  }

  static isRetryableError(error: any): boolean {
    if (error instanceof OdooConnectionError) {
      return true;
    }

    if (error instanceof OdooError && error.faultCode === 1) {
      return true;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('timeout') ||
             message.includes('connection') ||
             message.includes('network') ||
             message.includes('econnreset') ||
             message.includes('enotfound');
    }

    return false;
  }
}