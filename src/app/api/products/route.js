import { NextResponse } from 'next/server'
import fs from 'fs'
import { DATA_PATHS } from '../../../config/dataConfig.js'
import { 
  ConcurrencyError, 
  addVersioningToRecord, 
  validateVersion, 
  checkFileTimestamp, 
  createConflictResponse 
} from '../../../utils/concurrencyManager.js'

const productsFilePath = DATA_PATHS.products

// Helper function to read products data
function readProductsData() {
  try {
    const data = fs.readFileSync(productsFilePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading products data:', error)
    return []
  }
}

// Helper function to write products data
function writeProductsData(data) {
  try {
    fs.writeFileSync(productsFilePath, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error writing products data:', error)
    return false
  }
}

// GET - Get products for a specific customer or all products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    
    const productsData = readProductsData()
    
    if (customerId) {
      // Return products for specific customer
      const customerProducts = productsData.find(item => item.customerId === customerId)
      return NextResponse.json(customerProducts ? customerProducts.products : [])
    } else {
      // Return all products data
      return NextResponse.json(productsData)
    }
  } catch (error) {
    console.error('Error in GET /api/products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST - Add a new product for a customer
export async function POST(request) {
  try {
    const body = await request.json()
    const { customerId, product } = body
    
    if (!customerId || !product) {
      return NextResponse.json({ error: 'Customer ID and product data are required' }, { status: 400 })
    }
    
    // Check file timestamp before reading
    await checkFileTimestamp(productsFilePath)
    
    const productsData = readProductsData()
    
    // Add versioning to the new product
    addVersioningToRecord(product)
    
    // Find existing customer products or create new entry
    const existingIndex = productsData.findIndex(item => item.customerId === customerId)
    
    if (existingIndex >= 0) {
      // Add product to existing customer
      productsData[existingIndex].products.push(product)
    } else {
      // Create new customer products entry
      productsData.push({
        customerId,
        products: [product]
      })
    }
    
    const success = writeProductsData(productsData)
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Product added successfully' })
    } else {
      return NextResponse.json({ error: 'Failed to save product' }, { status: 500 })
    }
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error in POST /api/products:', error)
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 })
  }
}

// PUT - Update an existing product
export async function PUT(request) {
  try {
    const body = await request.json()
    const { customerId, productIndex, product, version } = body
    
    if (!customerId || productIndex === undefined || !product) {
      return NextResponse.json({ error: 'Customer ID, product index, and product data are required' }, { status: 400 })
    }
    
    // Check file timestamp before reading
    await checkFileTimestamp(productsFilePath)
    
    const productsData = readProductsData()
    
    // Find customer products
    const customerProductsIndex = productsData.findIndex(item => item.customerId === customerId)
    
    if (customerProductsIndex === -1) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    // Update the specific product
    if (productIndex >= 0 && productIndex < productsData[customerProductsIndex].products.length) {
      const currentProduct = productsData[customerProductsIndex].products[productIndex]
      
      // Validate version for concurrency control
      if (version) {
        validateVersion(currentProduct, version)
      }
      
      // Update the product
      const updatedProduct = { ...currentProduct, ...product }
      
      // Update versioning
      addVersioningToRecord(updatedProduct)
      
      productsData[customerProductsIndex].products[productIndex] = updatedProduct
      
      const success = writeProductsData(productsData)
      
      if (success) {
        return NextResponse.json({ success: true, message: 'Product updated successfully' })
      } else {
        return NextResponse.json({ error: 'Failed to save updated product' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid product index' }, { status: 400 })
    }
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error in PUT /api/products:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE - Delete a product
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const productIndex = parseInt(searchParams.get('productIndex'))
    const version = searchParams.get('version')
    
    if (!customerId || isNaN(productIndex)) {
      return NextResponse.json({ error: 'Customer ID and product index are required' }, { status: 400 })
    }
    
    // Check file timestamp before reading
    await checkFileTimestamp(productsFilePath)
    
    const productsData = readProductsData()
    
    // Find customer products
    const customerProductsIndex = productsData.findIndex(item => item.customerId === customerId)
    
    if (customerProductsIndex === -1) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    
    // Remove the specific product
    if (productIndex >= 0 && productIndex < productsData[customerProductsIndex].products.length) {
      const currentProduct = productsData[customerProductsIndex].products[productIndex]
      
      // Validate version for concurrency control
      if (version) {
        validateVersion(currentProduct, version)
      }
      
      productsData[customerProductsIndex].products.splice(productIndex, 1)
      
      const success = writeProductsData(productsData)
      
      if (success) {
        return NextResponse.json({ success: true, message: 'Product deleted successfully' })
      } else {
        return NextResponse.json({ error: 'Failed to save after deleting product' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid product index' }, { status: 400 })
    }
  } catch (error) {
    if (error instanceof ConcurrencyError) {
      return createConflictResponse(error.message, error.conflictData)
    }
    console.error('Error in DELETE /api/products:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
