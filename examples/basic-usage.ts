import { getOdooModelsClient, getOdooUid, xmlrpcCall } from '../src';

// Example configuration using environment variables
const config = {
  url: process.env.ODOO_URL || 'http://localhost:8069',
  database: process.env.ODOO_DB || 'odoo',
  username: process.env.ODOO_USERNAME || 'admin',
  apiKey: process.env.ODOO_API_KEY || 'your-api-key',
  timeout: 30000
};

async function basicUsage() {
  try {
    // Get user ID (authenticate)
    const uid = await getOdooUid(config);
    console.log('Authenticated with UID:', uid);

    // Get models client
    const modelsClient = getOdooModelsClient(config);

    // Example: Get version info
    const version = await xmlrpcCall(modelsClient, 'common.version', []);
    console.log('Odoo version:', version);

    // Example: Search for partners
    const partnerIds = await xmlrpcCall<number[]>(modelsClient, 'execute_kw', [
      config.database,
      uid,
      config.apiKey,
      'res.partner',
      'search',
      [[]],
      { limit: 5 }
    ]);
    console.log('Partner IDs:', partnerIds);

    // Example: Read partner data
    if (partnerIds.length > 0) {
      const partners = await xmlrpcCall(modelsClient, 'execute_kw', [
        config.database,
        uid,
        config.apiKey,
        'res.partner',
        'read',
        [partnerIds],
        { fields: ['name', 'email'] }
      ]);
      console.log('Partners:', partners);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
if (require.main === module) {
  basicUsage();
}