import { OdooClient } from '../src';

async function fieldValidationExample() {
  const client = new OdooClient({
    url: 'https://demo.odoo.com',
    database: 'demo',
    username: 'demo',
    password: 'demo'
  });

  try {
    // Connect
    await client.connect();
    
    // Create field mapper for res.partner model
    console.log('Creating field mapper...');
    const mapper = await client.createFieldMapper('res.partner');
    
    // Get field information
    const nameField = mapper.getFieldInfo('name');
    console.log('Name field info:', nameField);
    
    // Get required fields
    const requiredFields = mapper.getRequiredFields();
    console.log('Required fields:', requiredFields);
    
    // Validate a record
    const testRecord = {
      name: 'John Doe',
      email: 'invalid-email', // Invalid email format
      phone: 123456789, // Should be string
      customer_rank: '5' // String instead of number
    };
    
    console.log('Validating record:', testRecord);
    const validation = mapper.validateRecord(testRecord);
    
    if (!validation.isValid) {
      console.log('Validation errors:', validation.errors);
    } else {
      console.log('Record is valid');
    }
    
    // Transform record (fix types)
    const transformed = mapper.transformRecord(testRecord);
    console.log('Transformed record:', transformed);
    
    // Validate transformed record
    const revalidation = mapper.validateRecord(transformed);
    console.log('Revalidation result:', revalidation.isValid ? 'Valid' : 'Invalid');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fieldValidationExample();