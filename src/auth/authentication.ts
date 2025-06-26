import { XMLRPCClient } from '../client/xmlrpc';
import { OdooConfig, OdooResponse } from '../types';

export class OdooAuthentication {
  private xmlrpcClient: XMLRPCClient;
  private config: OdooConfig;
  private userId: number | null = null;

  constructor(config: OdooConfig) {
    this.config = config;
    this.xmlrpcClient = new XMLRPCClient(
      `${config.url}/xmlrpc/2/common`,
      config.timeout
    );
  }

  async authenticate(): Promise<OdooResponse<number>> {
    try {
      const response = await this.xmlrpcClient.call({
        service: 'common',
        method: 'authenticate',
        args: [
          this.config.database,
          this.config.username,
          this.config.password,
          {}
        ]
      });

      if (response.success && response.data) {
        this.userId = response.data as number;
        return {
          success: true,
          data: this.userId
        };
      }

      return {
        success: false,
        error: response.error || 'Authentication failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error'
      };
    }
  }

  async getVersion(): Promise<OdooResponse<any>> {
    try {
      const response = await this.xmlrpcClient.call({
        service: 'common',
        method: 'version',
        args: []
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Version check failed'
      };
    }
  }

  getUserId(): number | null {
    return this.userId;
  }

  isAuthenticated(): boolean {
    return this.userId !== null;
  }

  getConfig(): OdooConfig {
    return { ...this.config };
  }
}