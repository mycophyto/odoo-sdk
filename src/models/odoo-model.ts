import { XMLRPCClient } from '../client/xmlrpc';
import { OdooAuthentication } from '../auth/authentication';
import {
  OdooResponse,
  OdooModel,
  OdooCreateResult,
  OdooUpdateResult,
  OdooDeleteResult,
  OdooSearchDomain,
  OdooSearchOptions,
  OdooFieldInfo,
  OdooDomain
} from '../types';

export class OdooModelClient {
  private xmlrpcClient: XMLRPCClient;
  private auth: OdooAuthentication;
  private modelName: string;

  constructor(auth: OdooAuthentication, modelName: string) {
    this.auth = auth;
    this.modelName = modelName;
    const config = auth.getConfig();
    this.xmlrpcClient = new XMLRPCClient(
      `${config.url}/xmlrpc/2/object`,
      config.timeout
    );
  }

  async create(data: Partial<OdooModel>): Promise<OdooResponse<OdooCreateResult>> {
    if (!this.auth.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    try {
      const config = this.auth.getConfig();
      const response = await this.xmlrpcClient.call({
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          this.auth.getUserId(),
          config.password,
          this.modelName,
          'create',
          [data]
        ]
      });

      if (response.success) {
        return {
          success: true,
          data: { id: response.data as number }
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Create operation failed'
      };
    }
  }

  async read(ids: number[], fields?: string[]): Promise<OdooResponse<OdooModel[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    try {
      const config = this.auth.getConfig();
      const response = await this.xmlrpcClient.call({
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          this.auth.getUserId(),
          config.password,
          this.modelName,
          'read',
          [ids],
          fields ? { fields } : {}
        ]
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Read operation failed'
      };
    }
  }

  async update(ids: number[], data: Partial<OdooModel>): Promise<OdooResponse<OdooUpdateResult>> {
    if (!this.auth.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    try {
      const config = this.auth.getConfig();
      const response = await this.xmlrpcClient.call({
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          this.auth.getUserId(),
          config.password,
          this.modelName,
          'write',
          [ids, data]
        ]
      });

      if (response.success) {
        return {
          success: true,
          data: { success: true }
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update operation failed'
      };
    }
  }

  async delete(ids: number[]): Promise<OdooResponse<OdooDeleteResult>> {
    if (!this.auth.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    try {
      const config = this.auth.getConfig();
      const response = await this.xmlrpcClient.call({
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          this.auth.getUserId(),
          config.password,
          this.modelName,
          'unlink',
          [ids]
        ]
      });

      if (response.success) {
        return {
          success: true,
          data: { success: true }
        };
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete operation failed'
      };
    }
  }

  async search(domain: OdooDomain = [], options: OdooSearchOptions = {}): Promise<OdooResponse<number[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    try {
      const config = this.auth.getConfig();
      const searchOptions: any = {};
      
      if (options.offset !== undefined) searchOptions.offset = options.offset;
      if (options.limit !== undefined) searchOptions.limit = options.limit;
      if (options.order !== undefined) searchOptions.order = options.order;
      if (options.count !== undefined) searchOptions.count = options.count;

      const response = await this.xmlrpcClient.call({
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          this.auth.getUserId(),
          config.password,
          this.modelName,
          'search',
          [domain],
          searchOptions
        ]
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search operation failed'
      };
    }
  }

  async searchRead(
    domain: OdooDomain = [],
    fields?: string[],
    options: OdooSearchOptions = {}
  ): Promise<OdooResponse<OdooModel[]>> {
    if (!this.auth.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    try {
      const config = this.auth.getConfig();
      const searchOptions: any = {};
      
      if (options.offset !== undefined) searchOptions.offset = options.offset;
      if (options.limit !== undefined) searchOptions.limit = options.limit;
      if (options.order !== undefined) searchOptions.order = options.order;
      if (fields) searchOptions.fields = fields;

      const response = await this.xmlrpcClient.call({
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          this.auth.getUserId(),
          config.password,
          this.modelName,
          'search_read',
          [domain],
          searchOptions
        ]
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search read operation failed'
      };
    }
  }

  async count(domain: OdooDomain = []): Promise<OdooResponse<number>> {
    if (!this.auth.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    try {
      const config = this.auth.getConfig();
      const response = await this.xmlrpcClient.call({
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          this.auth.getUserId(),
          config.password,
          this.modelName,
          'search_count',
          [domain]
        ]
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Count operation failed'
      };
    }
  }

  async getFields(attributes?: string[]): Promise<OdooResponse<{ [key: string]: OdooFieldInfo }>> {
    if (!this.auth.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    try {
      const config = this.auth.getConfig();
      const response = await this.xmlrpcClient.call({
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          this.auth.getUserId(),
          config.password,
          this.modelName,
          'fields_get',
          [],
          attributes ? { attributes } : {}
        ]
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get fields operation failed'
      };
    }
  }

  async callMethod(method: string, args: any[] = [], kwargs: any = {}): Promise<OdooResponse> {
    if (!this.auth.isAuthenticated()) {
      return {
        success: false,
        error: 'Not authenticated'
      };
    }

    try {
      const config = this.auth.getConfig();
      const response = await this.xmlrpcClient.call({
        service: 'object',
        method: 'execute_kw',
        args: [
          config.database,
          this.auth.getUserId(),
          config.password,
          this.modelName,
          method,
          args,
          kwargs
        ]
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : `Method ${method} failed`
      };
    }
  }
}