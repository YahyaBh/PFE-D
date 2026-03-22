const db = require('./src/lib/db');
const { resendMFA } = require('./src/controllers/authController');

async function testResendMFA() {
  const [[firstUser]] = await db.query('SELECT id, email, mfa_code, mfa_expires FROM users LIMIT 1');
  
  if (!firstUser) {
    console.error('No users found in database for testing.');
    process.exit(1);
  }

  console.log('--- Initial State ---');
  console.log(`User ID: ${firstUser.id}`);
  console.log(`Email: ${firstUser.email}`);
  console.log(`Current MFA Code: ${firstUser.mfa_code}`);
  console.log(`Current MFA Expires: ${firstUser.mfa_expires}`);

  const req = {
    body: { userId: firstUser.id }
  };

  const res = {
    status: (code) => {
      console.log(`Response Status: ${code}`);
      return res;
    },
    json: (data) => {
      console.log('Response JSON:', data);
      return res;
    }
  };

  try {
    console.log('\nCalling resendMFA controller directly...');
    await resendMFA(req, res);

    const [[updatedUser]] = await db.query('SELECT mfa_code, mfa_expires FROM users WHERE id = ?', [firstUser.id]);
    
    console.log('\n--- Updated State ---');
    console.log(`New MFA Code: ${updatedUser.mfa_code}`);
    console.log(`New MFA Expires: ${updatedUser.mfa_expires}`);

    if (updatedUser.mfa_code !== firstUser.mfa_code) {
      console.log('\n✅ SUCCESS: MFA code was updated in the database.');
    } else {
      console.error('\n❌ FAILURE: MFA code was not changed.');
    }

  } catch (err) {
    console.error('Error during test:', err.message);
  } finally {
    process.exit(0);
  }
}

testResendMFA();
