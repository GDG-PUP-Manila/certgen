import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Service role client (for server-side storage & DB bypass)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
