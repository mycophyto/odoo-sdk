import * as http from 'http';
import * as https from 'https';
import { parseString } from 'xml2js';
import { OdooMethodCall, OdooResponse } from '../types';

export class XMLRPCClient {
  private url: URL;
  private timeout: number;

  constructor(url: string, timeout: number = 30000) {
    this.url = new URL(url);
    this.timeout = timeout;
  }

  async call(methodCall: OdooMethodCall): Promise<OdooResponse> {
    const xmlPayload = this.buildXMLRequest(methodCall);
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.url.hostname,
        port: this.url.port || (this.url.protocol === 'https:' ? 443 : 80),
        path: this.url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
          'Content-Length': Buffer.byteLength(xmlPayload),
          'User-Agent': 'Odoo-XML-SDK/1.0.0'
        },
        timeout: this.timeout
      };

      const client = this.url.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          this.parseXMLResponse(data)
            .then(resolve)
            .catch(reject);
        });
      });

      req.on('error', (error) => {
        reject({
          success: false,
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({
          success: false,
          error: 'Request timeout'
        });
      });

      req.write(xmlPayload);
      req.end();
    });
  }

  private buildXMLRequest(methodCall: OdooMethodCall): string {
    const params = methodCall.args.map(arg => this.serializeValue(arg)).join('');
    
    return `<?xml version="1.0"?>
<methodCall>
  <methodName>${methodCall.service}.${methodCall.method}</methodName>
  <params>
    ${params}
  </params>
</methodCall>`;
  }

  private serializeValue(value: any): string {
    if (value === null || value === undefined) {
      return '<param><value><nil/></value></param>';
    }
    
    if (typeof value === 'string') {
      return `<param><value><string>${this.escapeXML(value)}</string></value></param>`;
    }
    
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return `<param><value><int>${value}</int></value></param>`;
      } else {
        return `<param><value><double>${value}</double></value></param>`;
      }
    }
    
    if (typeof value === 'boolean') {
      return `<param><value><boolean>${value ? '1' : '0'}</boolean></value></param>`;
    }
    
    if (Array.isArray(value)) {
      const arrayItems = value.map(item => `<value>${this.serializeValueContent(item)}</value>`).join('');
      return `<param><value><array><data>${arrayItems}</data></array></value></param>`;
    }
    
    if (typeof value === 'object') {
      const structMembers = Object.entries(value)
        .map(([key, val]) => `<member><name>${this.escapeXML(key)}</name><value>${this.serializeValueContent(val)}</value></member>`)
        .join('');
      return `<param><value><struct>${structMembers}</struct></value></param>`;
    }
    
    return `<param><value><string>${this.escapeXML(String(value))}</string></value></param>`;
  }

  private serializeValueContent(value: any): string {
    if (value === null || value === undefined) {
      return '<nil/>';
    }
    
    if (typeof value === 'string') {
      return `<string>${this.escapeXML(value)}</string>`;
    }
    
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return `<int>${value}</int>`;
      } else {
        return `<double>${value}</double>`;
      }
    }
    
    if (typeof value === 'boolean') {
      return `<boolean>${value ? '1' : '0'}</boolean>`;
    }
    
    if (Array.isArray(value)) {
      const arrayItems = value.map(item => `<value>${this.serializeValueContent(item)}</value>`).join('');
      return `<array><data>${arrayItems}</data></array>`;
    }
    
    if (typeof value === 'object') {
      const structMembers = Object.entries(value)
        .map(([key, val]) => `<member><name>${this.escapeXML(key)}</name><value>${this.serializeValueContent(val)}</value></member>`)
        .join('');
      return `<struct>${structMembers}</struct>`;
    }
    
    return `<string>${this.escapeXML(String(value))}</string>`;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async parseXMLResponse(xml: string): Promise<OdooResponse> {
    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) {
          reject({
            success: false,
            error: 'Failed to parse XML response'
          });
          return;
        }

        try {
          if (result.methodResponse && result.methodResponse.fault) {
            const fault = result.methodResponse.fault[0];
            const faultValue = this.deserializeValue(fault.value[0]);
            
            resolve({
              success: false,
              faultCode: faultValue.faultCode,
              faultString: faultValue.faultString,
              error: faultValue.faultString
            });
          } else if (result.methodResponse && result.methodResponse.params) {
            const params = result.methodResponse.params[0].param;
            const data = params.map((param: any) => this.deserializeValue(param.value[0]));
            
            resolve({
              success: true,
              data: data.length === 1 ? data[0] : data
            });
          } else {
            reject({
              success: false,
              error: 'Invalid XML-RPC response format'
            });
          }
        } catch (error) {
          reject({
            success: false,
            error: 'Failed to deserialize response'
          });
        }
      });
    });
  }

  private deserializeValue(value: any): any {
    if (value.nil) {
      return null;
    }
    
    if (value.string !== undefined) {
      return value.string[0] || '';
    }
    
    if (value.int !== undefined) {
      return parseInt(value.int[0], 10);
    }
    
    if (value.i4 !== undefined) {
      return parseInt(value.i4[0], 10);
    }
    
    if (value.double !== undefined) {
      return parseFloat(value.double[0]);
    }
    
    if (value.boolean !== undefined) {
      return value.boolean[0] === '1' || value.boolean[0] === 'true';
    }
    
    if (value.array && value.array[0] && value.array[0].data) {
      const data = value.array[0].data[0];
      if (data.value) {
        return data.value.map((v: any) => this.deserializeValue(v));
      }
      return [];
    }
    
    if (value.struct && value.struct[0] && value.struct[0].member) {
      const struct: any = {};
      value.struct[0].member.forEach((member: any) => {
        const name = member.name[0];
        const val = this.deserializeValue(member.value[0]);
        struct[name] = val;
      });
      return struct;
    }
    
    return value;
  }
}