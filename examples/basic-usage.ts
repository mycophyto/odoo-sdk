import { OdooClient } from '../src';

async function basicExample() {
  const client = new OdooClient({
    url: 'https://demo.odoo.com',
    database: 'demo',
    username: 'demo',
    password: 'demo'
  });

  try {
    // Connect to Odoo
    console.log('Connecting to Odoo...');
    const authResult = await client.connect();
    
    if (!authResult.success) {
      console.error('Authentication failed:', authResult.error);
      return;
    }
    
    console.log('Connected successfully! User ID:', authResult.data);

    // Get version info
    const version = await client.getVersion();
    console.log('Odoo version:', version.data);

    // Work with partners
    const partners = client.model('res.partner');

    // Create a new partner
    console.log('Creating new partner...');
    const newPartner = await partners.create({
      name: 'Test Partner',
      email: 'test@example.com',
      phone: '+1-555-0123',
      is_company: false
    });

    if (newPartner.success) {
      console.log('Partner created with ID:', newPartner.data?.id);
      
      // Read the created partner
      const partner = await partners.read([newPartner.data!.id], ['name', 'email', 'phone']);
      console.log('Partner details:', partner.data);

      // Update the partner
      await partners.update([newPartner.data!.id], {
        phone: '+1-555-9999'
      });
      console.log('Partner updated');

      // Search for partners
      const searchResults = await partners.searchRead([
        { field: 'name', operator: 'ilike', value: 'Test' }
      ], ['name', 'email', 'phone']);
      
      console.log('Search results:', searchResults.data);

      // Clean up - delete the test partner
      await partners.delete([newPartner.data!.id]);
      console.log('Test partner deleted');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
basicExample();