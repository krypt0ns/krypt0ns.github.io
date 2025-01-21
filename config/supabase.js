const supabaseUrl = 'https://jgdkrezxgwhcaognnjlq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZGtyZXp4Z3doY2FvZ25uamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTAyMjgsImV4cCI6MjA1MzA2NjIyOH0.kNkduc3dqYZJUWD5_5F3UcoQ-aP1jr9jrrADyJ45CGc';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

export { supabase };