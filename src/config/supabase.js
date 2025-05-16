const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials in environment variables');
  console.error('Make sure SUPABASE_URL and SUPABASE_KEY are set in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;