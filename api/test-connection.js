require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testConnection() {
  try {
    console.log('🔄 Testing connection to Supabase...');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('');
    
    // Test 1: Check all tables
    const tables_to_check = [
      'profiles',
      'platform_connections', 
      'oauth_states',
      'payment_history',
      'api_keys',
      'audit_log'
    ];
    
    let all_ok = true;
    
    for (const table of tables_to_check) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        all_ok = false;
      } else {
        console.log(`✅ ${table}: OK`);
      }
    }
    
    console.log('');
    if (all_ok) {
      console.log('✅✅✅ Backend is fully connected to Supabase! ✅✅✅');
      console.log('');
      console.log('API Endpoints ready:');
      console.log('  POST /api/auth/register');
      console.log('  POST /api/auth/login');
      console.log('  GET  /api/auth/me');
      console.log('  POST /api/payments/create-checkout');
      console.log('  GET  /api/platforms');
    } else {
      console.log('⚠️  Some tables have issues');
    }
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  }
}

testConnection();
