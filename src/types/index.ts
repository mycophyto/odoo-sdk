export interface OdooConfig {
  url: string;
  database: string;
  username: string;
  apiKey: string;
  timeout?: number;
}

export interface OdooResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  faultCode?: number;
  faultString?: string;
}

export interface OdooSearchDomain {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'ilike' | 'in' | 'not in' | '=like' | '=ilike';
  value: any;
}

export interface OdooSearchOptions {
  offset?: number;
  limit?: number;
  order?: string;
  count?: boolean;
}

export interface OdooFieldInfo {
  string: string;
  type: string;
  required?: boolean;
  readonly?: boolean;
  help?: string;
  relation?: string;
  selection?: Array<[string | number, string]>;
}

export interface OdooModel {
  [key: string]: any;
  id?: number;
}

export interface OdooCreateResult {
  id: number;
}

export interface OdooUpdateResult {
  success: boolean;
}

export interface OdooDeleteResult {
  success: boolean;
}

export type OdooDomain = Array<OdooSearchDomain | '&' | '|' | '!'>;

export interface OdooMethodCall {
  service: string;
  method: string;
  args: any[];
}