// API route with OneDrive integration support
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CUSTOMERS_FILE = path.join(process.cwd(), 'src/data/customers.json');

export async function GET() {
  try {
    const fileContents = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
    const customers = JSON.parse(fileContents);
    
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error reading customers file:', error);
    return NextResponse.json({ error: 'Failed to load customers' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const customers = await request.json();
    
    // Validate data structure
    if (!Array.isArray(customers)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }
    
    // Write to local file
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Customers updated successfully',
      count: customers.length 
    });
  } catch (error) {
    console.error('Error updating customers file:', error);
    return NextResponse.json({ error: 'Failed to update customers' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { customer } = await request.json();
    
    if (!customer || !customer.id) {
      return NextResponse.json({ error: 'Invalid customer data' }, { status: 400 });
    }
    
    // Read current customers
    const fileContents = fs.readFileSync(CUSTOMERS_FILE, 'utf8');
    const customers = JSON.parse(fileContents);
    
    // Find and update customer
    const customerIndex = customers.findIndex(c => c.id === customer.id);
    if (customerIndex === -1) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }
    
    customers[customerIndex] = { ...customers[customerIndex], ...customer };
    
    // Write back to file
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      message: 'Customer updated successfully',
      customer: customers[customerIndex] 
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
