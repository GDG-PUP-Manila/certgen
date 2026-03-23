import { supabaseAdmin } from "../lib/supabase";

export const uploadCertificate = async (fileName: string, pdfBuffer: Buffer): Promise<string> => {
  const { error: uploadError } = await supabaseAdmin.storage
    .from("public")
    .upload(fileName, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });
    
  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    throw new Error("Failed to securely store your generated certificate. Please try again.");
  }
  
  const { data: { publicUrl } } = supabaseAdmin.storage.from("public").getPublicUrl(fileName);
  return publicUrl;
};
