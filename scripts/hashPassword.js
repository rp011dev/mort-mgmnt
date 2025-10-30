// Script to generate bcrypt hash for a password
// Usage: node scripts/hashPassword.js

const bcrypt = require('bcryptjs')

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

// Hash the password
const password = 'password123'

hashPassword(password).then(hash => {
  console.log('\n=================================')
  console.log('Password:', password)
  console.log('=================================')
  console.log('Bcrypt Hash:')
  console.log(hash)
  console.log('=================================')
  console.log('\nMongoDB Update Command:')
  console.log('db.user.updateOne(')
  console.log('  { email: "your-email@example.com" },')
  console.log('  { $set: { password: "' + hash + '" } }')
  console.log(')')
  console.log('=================================\n')
}).catch(err => {
  console.error('Error:', err)
})
