// @ts-expect-error: No types for 'xmlrpc' module
import xmlrpc from "xmlrpc";
import { OdooConfig, OdooResponse } from '../types';

export const xmlrpcCall = <T>(
  client: any,
  method: string,
  params: any[],
): Promise<T> =>
  new Promise((resolve, reject) => {
    client.methodCall(method, params, (err: Error | null, val: T) => {
      if (err) reject(err);
      else resolve(val);
    });
  });

export const getOdooUid = async (config: OdooConfig): Promise<number> => {
  const common = xmlrpc.createClient({ 
    url: `${config.url}/xmlrpc/2/common`,
    timeout: config.timeout || 30000
  });
  const uid = await xmlrpcCall<number>(common, "authenticate", [
    config.database,
    config.username,
    config.apiKey,
    {},
  ]);
  if (!uid) throw new Error("Odoo authentication failed.");
  return uid;
};

export const getOdooModelsClient = (config: OdooConfig) =>
  xmlrpc.createClient({ 
    url: `${config.url}/xmlrpc/2/object`,
    timeout: config.timeout || 30000
  });

export class OdooAuthentication {
  private config: OdooConfig;
  private userId: number | null = null;
  private commonClient: any;
  private objectClient: any;

  constructor(config: OdooConfig) {
    this.config = config;
    this.commonClient = xmlrpc.createClient({ 
      url: `${config.url}/xmlrpc/2/common`,
      timeout: config.timeout || 30000
    });
    this.objectClient = xmlrpc.createClient({ 
      url: `${config.url}/xmlrpc/2/object`,
      timeout: config.timeout || 30000
    });
  }

  async authenticate(): Promise<OdooResponse<number>> {
    try {
      const uid = await xmlrpcCall<number>(
        this.commonClient, 
        "authenticate", 
        [
          this.config.database,
          this.config.username,
          this.config.apiKey,
          {}
        ]
      );

      if (uid) {
        this.userId = uid;
        return {
          success: true,
          data: this.userId
        };
      }

      return {
        success: false,
        error: 'Authentication failed'
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
      const version = await xmlrpcCall<any>(
        this.commonClient, 
        "version", 
        []
      );

      return {
        success: true,
        data: version
      };
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

  getCommonClient(): any {
    return this.commonClient;
  }

  getObjectClient(): any {
    return this.objectClient;
  }
}