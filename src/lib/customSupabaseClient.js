import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xmkustoeuvvblxfjsncj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhta3VzdG9ldXZ2Ymx4ZmpzbmNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTcxMTIsImV4cCI6MjA3MzI3MzExMn0.etpk0cZHVOajnKZVFtePFt8zI22DWevVpZpQK7n_VYw';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
