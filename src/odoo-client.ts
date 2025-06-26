import { OdooAuthentication } from './auth/authentication';
import { OdooModelClient } from './models/odoo-model';
import { FieldMapper } from './utils/field-mapper';
import { RetryManager, RetryOptions } from './utils/retry';
import { ErrorHandler } from './utils/error-handler';
import { OdooConfig, OdooResponse } from './types';

export class OdooClient {
  private auth: OdooAuthentication;
  private modelClients: Map<string, OdooModelClient> = new Map();
  private retryManager: RetryManager;

  constructor(config: OdooConfig, retryOptions?: RetryOptions) {
    this.auth = new OdooAuthentication(config);
    this.retryManager = new RetryManager();
  }

  async connect(): Promise<OdooResponse<number>> {
    try {
      return await this.retryManager.retry(
        () => this.auth.authenticate(),
        { retryCondition: ErrorHandler.isRetryableError }
      );
    } catch (error) {
      return ErrorHandler.createErrorResponse(error);
    }
  }

  async getVersion(): Promise<OdooResponse<any>> {
    try {
      return await this.retryManager.retry(
        () => this.auth.getVersion(),
        { retryCondition: ErrorHandler.isRetryableError }
      );
    } catch (error) {
      return ErrorHandler.createErrorResponse(error);
    }
  }

  model(modelName: string): OdooModelClient {
    if (!this.modelClients.has(modelName)) {
      this.modelClients.set(modelName, new OdooModelClient(this.auth, modelName));
    }
    return this.modelClients.get(modelName)!;
  }

  async createFieldMapper(modelName: string): Promise<FieldMapper> {
    const modelClient = this.model(modelName);
    const fieldsResponse = await modelClient.getFields();
    
    const mapper = new FieldMapper();
    if (fieldsResponse.success && fieldsResponse.data) {
      mapper.setFieldsInfo(fieldsResponse.data);
    }
    
    return mapper;
  }

  isConnected(): boolean {
    return this.auth.isAuthenticated();
  }

  getUserId(): number | null {
    return this.auth.getUserId();
  }

  getConfig(): OdooConfig {
    return this.auth.getConfig();
  }
}