
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function getEarliestDate() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('leads')
    .select('created_at')
    .not('phone', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('EARLIEST_REVEAL_DATE:', data[0].created_at);
  } else {
    console.log('No revealed leads found in database.');
  }
}

getEarliestDate();
