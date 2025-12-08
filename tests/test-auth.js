const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test JWT signing and verification
console.log('Testing JWT functionality...\n');

// Test 1: Hash password
const password = 'admin123';
bcrypt.hash(password, 10).then(hash => {
  console.log('1. Password hashing test:');
  console.log(`   Password: ${password}`);
  console.log(`   Hash: ${hash.substring(0, 30)}...`);
  
  // Test 2: Verify password
  return bcrypt.compare(password, hash);
}).then(isValid => {
  console.log(`   Password match: ${isValid}\n`);
  
  // Test 3: JWT signing
  const secret = 'your-super-secret-jwt-key-change-in-production';
  const payload = {
    userId: 1,
    username: 'admin',
    role: 'admin'
  };
  
  console.log('2. JWT signing test:');
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });
  console.log(`   Token generated: ${token.substring(0, 30)}...`);
  
  // Test 4: JWT verification
  console.log('3. JWT verification test:');
  try {
    const decoded = jwt.verify(token, secret);
    console.log(`   Token verified successfully`);
    console.log(`   Decoded payload:`, decoded);
  } catch (error) {
    console.log(`   Token verification failed: ${error.message}`);
  }
}).catch(err => {
  console.error('Error:', err);
});