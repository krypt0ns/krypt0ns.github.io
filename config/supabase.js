const supabaseUrl = 'https://jgdkrezxgwhcaognnjlq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnZGtyZXp4Z3doY2FvZ25uamxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY5MjE2MDAsImV4cCI6MjAyMjQ5NzYwMH0.Uh9qXuuA1A9W8e3FzXHrdRoqQA2I2GWX--dqL4s_KQo';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

export { supabase };