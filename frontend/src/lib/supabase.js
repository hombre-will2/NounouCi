import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "https://fdjnkrthnxzxozlgnfsz.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "sb_publishable_NLPeHCfi8__z7e3IAzakSA_qvwbZvHu";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
