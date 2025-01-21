// import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jgdkrezxgwhcaognnjlq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZGtyZXp4Z3doY2FvZ25uamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTAyMjgsImV4cCI6MjA1MzA2NjIyOH0.kNkduc3dqYZJUWD5_5F3UcoQ-aP1jr9jrrADyJ45CGc';

// Create Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Add default headers to all requests
supabase.headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
};

export { supabase };