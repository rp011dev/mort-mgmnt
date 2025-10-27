import { NextResponse } from 'next/server';
import { getCollection } from '../../../utils/mongoDb';
import { MONGODB_CONFIG } from '../../../config/dataConfig';
import { ConcurrencyError, createConflictResponse } from '../../../utils/concurrencyManager.js';

// Get collection reference once
let productsCollection = null;

async function getProductsCollection() {
  if (!productsCollection) {
    productsCollection = await getCollection(MONGODB_CONFIG.collections.products);
  }
  return productsCollection;
}

// GET - Get products for a specific customer or all products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    const collection = await getProductsCollection();
    
    if (customerId) {
      // Find single document for the specific customer
      const customerDoc = await collection.findOne(
        { customerId }
      );

      // Return the products array or empty array if no document found
      const products = customerDoc?.products || [];
      return NextResponse.json(products);
    } else {
      // For listing all products, maintain the grouping
      const allProducts = await collection.find({}, {
        projection: { _id: 0 } // Exclude MongoDB _id field
      }).toArray();
      
      // Group by customerId
      const groupedProducts = allProducts.reduce((acc, product) => {
        if (!acc[product.customerId]) {
          acc[product.customerId] = [];
        }
        acc[product.customerId].push(product);
        return acc;
      }, {});
      
      // Convert to array format
      const formattedProducts = Object.entries(groupedProducts).map(([customerId, products]) => ({
        customerId,
        products
      }));
      
      return NextResponse.json(formattedProducts);
    }
  } catch (error) {
    console.error('Error in GET /api/products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST - Add a new product for a customer
export async function POST(request) {
  try {
    const body = await request.json();
    const { customerId, product } = body;
    
    if (!customerId || !product) {
      return NextResponse.json({ error: 'Customer ID and product data are required' }, { status: 400 });
    }
    
    const collection = await getProductsCollection();
    
    // Prepare the product document
    const newProduct = {
      ...product,
      customerId,
      _version: 1,
      _lastModified: new Date().toISOString()
    };
    
    // Insert the product
    const result = await collection.insertOne(newProduct);
    
    if (result.acknowledged) {
      return NextResponse.json({
        success: true,
        message: 'Product added successfully',
        productId: result.insertedId
      });
    } else {
      return NextResponse.json({ error: 'Failed to save product' }, { status: 500 });
    }
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData);
    }
    console.error('Error in POST /api/products:', error);
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}

// PUT - Update an existing product
export async function PUT(request) {
  try {
    const body = await request.json();
    const { customerId, productId, product, version } = body;
    
    if (!customerId || !productId || !product) {
      return NextResponse.json({ error: 'Customer ID, product ID, and product data are required' }, { status: 400 });
    }
    
    const collection = await getProductsCollection();
    
    // Find current product
    const currentProduct = await collection.findOne({ 
      _id: productId,
      customerId 
    });
    
    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Validate version for concurrency control
    if (version && currentProduct._version !== version) {
      return createConflictResponse('Version mismatch', {
        serverVersion: currentProduct._version,
        clientVersion: version,
        serverData: currentProduct
      });
    }
    
    // Prepare update data
    const updateData = {
      ...product,
      _version: (currentProduct._version || 0) + 1,
      _lastModified: new Date().toISOString()
    };
    
    // Update the product with version check
    const result = await collection.findOneAndUpdate(
      { 
        _id: productId,
        customerId,
        _version: version || currentProduct._version 
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return NextResponse.json({ 
        error: 'Failed to update product, possible concurrent modification' 
      }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: result
    });
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData);
    }
    console.error('Error in PUT /api/products:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Delete a product
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const productId = searchParams.get('productId');
    const version = searchParams.get('version');
    
    if (!customerId || !productId) {
      return NextResponse.json({ error: 'Customer ID and product ID are required' }, { status: 400 });
    }
    
    const collection = await getProductsCollection();
    
    // Find current product first to check version
    const currentProduct = await collection.findOne({ 
      _id: productId,
      customerId 
    });
    
    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Validate version for concurrency control
    if (version && currentProduct._version !== parseInt(version)) {
      return createConflictResponse('Version mismatch', {
        serverVersion: currentProduct._version,
        clientVersion: parseInt(version),
        serverData: currentProduct
      });
    }
    
    // Delete the product with version check
    const result = await collection.deleteOne({ 
      _id: productId,
      customerId,
      _version: version ? parseInt(version) : currentProduct._version
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete product, possible concurrent modification' 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData);
    }
    console.error('Error in DELETE /api/products:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
