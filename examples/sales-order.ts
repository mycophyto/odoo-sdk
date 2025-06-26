import { OdooClient } from '../src';

async function salesOrderExample() {
  const client = new OdooClient({
    url: 'https://demo.odoo.com',
    database: 'demo',
    username: 'demo',
    password: 'demo'
  });

  try {
    // Connect
    await client.connect();
    
    const partners = client.model('res.partner');
    const products = client.model('product.product');
    const orders = client.model('sale.order');
    
    // Find a customer
    const customerResult = await partners.searchRead([
      { field: 'customer_rank', operator: '>', value: 0 }
    ], ['name'], { limit: 1 });
    
    if (!customerResult.success || !customerResult.data?.length) {
      console.log('No customers found');
      return;
    }
    
    const customer = customerResult.data[0];
    console.log('Found customer:', customer.name);
    
    // Find a product
    const productResult = await products.searchRead([
      { field: 'sale_ok', operator: '=', value: true }
    ], ['name', 'list_price'], { limit: 1 });
    
    if (!productResult.success || !productResult.data?.length) {
      console.log('No products found');
      return;
    }
    
    const product = productResult.data[0];
    console.log('Found product:', product.name, 'Price:', product.list_price);
    
    // Create sales order
    console.log('Creating sales order...');
    const orderData = {
      partner_id: customer.id,
      order_line: [
        [0, 0, { // Command to create new line
          product_id: product.id,
          product_uom_qty: 2,
          price_unit: product.list_price
        }]
      ]
    };
    
    const orderResult = await orders.create(orderData);
    
    if (orderResult.success) {
      console.log('Sales order created with ID:', orderResult.data?.id);
      
      // Read the created order
      const order = await orders.read([orderResult.data!.id], [
        'name', 'partner_id', 'amount_total', 'state'
      ]);
      
      console.log('Order details:', order.data);
      
      // Try to confirm the order (this might fail due to missing required fields)
      try {
        await orders.callMethod('action_confirm', [[orderResult.data!.id]]);
        console.log('Order confirmed');
      } catch (error) {
        console.log('Could not confirm order (missing required data):', error);
      }
      
      // Get order lines
      const orderLines = client.model('sale.order.line');
      const lines = await orderLines.searchRead([
        { field: 'order_id', operator: '=', value: orderResult.data!.id }
      ], ['product_id', 'product_uom_qty', 'price_unit', 'price_subtotal']);
      
      console.log('Order lines:', lines.data);
      
    } else {
      console.error('Failed to create order:', orderResult.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

salesOrderExample();