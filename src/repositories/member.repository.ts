import { supabaseAdmin } from "../lib/supabase";

export const getMemberById = async (gdg_id: string) => {
  const { data: member, error } = await supabaseAdmin
    .from("gdg_members")
    .select("display_name, email")
    .eq("gdg_id", gdg_id)
    .single();
    
  if (error || !member) throw new Error("We couldn't find a GDG Member with that ID. Please check and try again.");
  
  return member;
};
