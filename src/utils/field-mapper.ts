import { OdooFieldInfo, OdooModel } from '../types';

export class FieldMapper {
  private fieldsInfo: { [key: string]: OdooFieldInfo } = {};

  setFieldsInfo(fieldsInfo: { [key: string]: OdooFieldInfo }): void {
    this.fieldsInfo = fieldsInfo;
  }

  validateRecord(record: Partial<OdooModel>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [fieldName, fieldValue] of Object.entries(record)) {
      const fieldInfo = this.fieldsInfo[fieldName];
      
      if (!fieldInfo) {
        errors.push(`Unknown field: ${fieldName}`);
        continue;
      }

      if (fieldInfo.readonly && fieldValue !== undefined) {
        errors.push(`Field ${fieldName} is readonly`);
        continue;
      }

      if (fieldInfo.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
        errors.push(`Field ${fieldName} is required`);
        continue;
      }

      const typeValidation = this.validateFieldType(fieldName, fieldValue, fieldInfo);
      if (!typeValidation.isValid) {
        errors.push(...typeValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateFieldType(
    fieldName: string,
    fieldValue: any,
    fieldInfo: OdooFieldInfo
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (fieldValue === null || fieldValue === undefined) {
      return { isValid: true, errors: [] };
    }

    switch (fieldInfo.type) {
      case 'char':
      case 'text':
      case 'html':
        if (typeof fieldValue !== 'string') {
          errors.push(`Field ${fieldName} must be a string`);
        }
        break;

      case 'integer':
        if (!Number.isInteger(fieldValue)) {
          errors.push(`Field ${fieldName} must be an integer`);
        }
        break;

      case 'float':
      case 'monetary':
        if (typeof fieldValue !== 'number') {
          errors.push(`Field ${fieldName} must be a number`);
        }
        break;

      case 'boolean':
        if (typeof fieldValue !== 'boolean') {
          errors.push(`Field ${fieldName} must be a boolean`);
        }
        break;

      case 'date':
        if (!this.isValidDate(fieldValue)) {
          errors.push(`Field ${fieldName} must be a valid date (YYYY-MM-DD)`);
        }
        break;

      case 'datetime':
        if (!this.isValidDateTime(fieldValue)) {
          errors.push(`Field ${fieldName} must be a valid datetime (YYYY-MM-DD HH:MM:SS)`);
        }
        break;

      case 'selection':
        if (fieldInfo.selection) {
          const validValues = fieldInfo.selection.map(([value]) => value);
          if (!validValues.includes(fieldValue)) {
            errors.push(`Field ${fieldName} must be one of: ${validValues.join(', ')}`);
          }
        }
        break;

      case 'many2one':
        if (!Number.isInteger(fieldValue) && !Array.isArray(fieldValue)) {
          errors.push(`Field ${fieldName} must be an integer (ID) or array [ID, name]`);
        } else if (Array.isArray(fieldValue)) {
          if (fieldValue.length !== 2 || !Number.isInteger(fieldValue[0]) || typeof fieldValue[1] !== 'string') {
            errors.push(`Field ${fieldName} array must be [ID, name] format`);
          }
        }
        break;

      case 'one2many':
      case 'many2many':
        if (!Array.isArray(fieldValue)) {
          errors.push(`Field ${fieldName} must be an array`);
        } else {
          for (const item of fieldValue) {
            if (!Number.isInteger(item) && !Array.isArray(item)) {
              errors.push(`Field ${fieldName} array items must be integers (IDs) or command arrays`);
              break;
            }
          }
        }
        break;

      case 'binary':
        if (typeof fieldValue !== 'string') {
          errors.push(`Field ${fieldName} must be a base64 encoded string`);
        }
        break;

      default:
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isValidDateTime(value: any): boolean {
    if (typeof value !== 'string') return false;
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
    if (!dateTimeRegex.test(value)) return false;
    const date = new Date(value.replace(' ', 'T'));
    return date instanceof Date && !isNaN(date.getTime());
  }

  transformRecord(record: Partial<OdooModel>): Partial<OdooModel> {
    const transformed: Partial<OdooModel> = {};

    for (const [fieldName, fieldValue] of Object.entries(record)) {
      const fieldInfo = this.fieldsInfo[fieldName];
      
      if (!fieldInfo) {
        transformed[fieldName] = fieldValue;
        continue;
      }

      transformed[fieldName] = this.transformFieldValue(fieldValue, fieldInfo);
    }

    return transformed;
  }

  private transformFieldValue(value: any, fieldInfo: OdooFieldInfo): any {
    if (value === null || value === undefined) {
      return value;
    }

    switch (fieldInfo.type) {
      case 'integer':
        return typeof value === 'string' ? parseInt(value, 10) : value;

      case 'float':
      case 'monetary':
        return typeof value === 'string' ? parseFloat(value) : value;

      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);

      case 'date':
        if (value instanceof Date) {
          return value.toISOString().split('T')[0];
        }
        return value;

      case 'datetime':
        if (value instanceof Date) {
          return value.toISOString().replace('T', ' ').split('.')[0];
        }
        return value;

      default:
        return value;
    }
  }

  getFieldInfo(fieldName: string): OdooFieldInfo | undefined {
    return this.fieldsInfo[fieldName];
  }

  getRequiredFields(): string[] {
    return Object.entries(this.fieldsInfo)
      .filter(([, fieldInfo]) => fieldInfo.required)
      .map(([fieldName]) => fieldName);
  }

  getReadonlyFields(): string[] {
    return Object.entries(this.fieldsInfo)
      .filter(([, fieldInfo]) => fieldInfo.readonly)
      .map(([fieldName]) => fieldName);
  }
}