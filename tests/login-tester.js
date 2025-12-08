const jwt = require('jsonwebtoken');

// ====== CONFIGURE THIS ======
const LOGIN_URL = 'http://localhost:5001/api/v1/auth/login'; // change if needed
const TEST_EMAIL = 'admin@gmail.com';
const TEST_PASSWORD = 'admin123';
const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';
// ============================

(async () => {
  console.log('\n🚀 Testing Login Route...\n');

  try {
    // 1. Send login request with native fetch
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    const data = await response.json();

    console.log('1. Login Response:');
    console.log(data);

    if (!response.ok) {
      console.log(`\n❌ Login failed with status: ${response.status}`);
      return;
    }

    // 2. Extract token
    const token = data?.token || data?.accessToken || data?.jwt;

    if (!token) {
      console.log('\n❌ No token returned from backend.\n');
      console.log('⚠️ Problem is in backend login logic, not Postman.\n');
      return;
    }

    console.log(`\n2. Received JWT Token: ${token.substring(0, 50)}...\n`);

    // 3. Verify JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('3. Token verification successful ✔️');
      console.log('Decoded payload:', decoded);
    } catch (err) {
      console.log('\n❌ Token verification failed');
      console.log(err.message);
      console.log('\n⚠️ JWT secret mismatch between .env and login-tester.\n');
    }

  } catch (err) {
    console.log('\n❌ Error occurred while testing login route:');
    console.log(err.message);
  }
})();
