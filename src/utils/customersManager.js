// Customers management utility - uses API to interact with customers.json file

export const getCustomer = async (customerId, authenticatedFetch) => {
  try {
    const fetchFn = authenticatedFetch || fetch
    const response = await fetchFn(`/api/customers?customerId=${customerId}`)
    const customer = await response.json()
    
    if (!response.ok) {
      throw new Error(customer.error || 'Failed to fetch customer')
    }
    
    return customer
  } catch (error) {
    console.error('Error fetching customer:', error)
    throw error
  }
}

export const getAllCustomers = async (authenticatedFetch) => {
  try {
    const fetchFn = authenticatedFetch || fetch
    const response = await fetchFn('/api/customers')
    const customers = await response.json()
    
    if (!response.ok) {
      throw new Error(customers.error || 'Failed to fetch customers')
    }
    
    return customers
  } catch (error) {
    console.error('Error fetching customers:', error)
    throw error
  }
}

export const updateCustomer = async (customerId, customerData, authenticatedFetch) => {
  try {
    const fetchFn = authenticatedFetch || fetch
    const response = await fetchFn('/api/customers', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        customerData
      })
    })
    
    const updatedCustomer = await response.json()
    
    if (!response.ok) {
      throw new Error(updatedCustomer.error || 'Failed to update customer')
    }
    
    return updatedCustomer
  } catch (error) {
    console.error('Error updating customer:', error)
    throw error
  }
}
