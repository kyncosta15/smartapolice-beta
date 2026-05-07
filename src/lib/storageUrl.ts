import { supabase } from "@/integrations/supabase/client";

/**
 * Convert a stored URL (legacy public URL) or a bucket+path into a short-lived
 * signed URL. Required after fleet-documents / frotas_docs / documents buckets
 * were made private for security.
 */
export async function getSignedDocumentUrl(
  urlOrPath: string,
  fallbackBucket?: string,
  expiresInSeconds = 600
): Promise<string> {
  if (!urlOrPath) return "";

  // Already a signed URL — return as-is
  if (urlOrPath.includes("/storage/v1/object/sign/")) return urlOrPath;

  let bucket = fallbackBucket || "";
  let path = urlOrPath;

  const publicMatch = urlOrPath.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (publicMatch) {
    bucket = publicMatch[1];
    path = decodeURIComponent(publicMatch[2]);
  }

  if (!bucket) return urlOrPath; // not a storage url, return original

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("Falha ao gerar signed URL:", error);
    return urlOrPath;
  }
  return data.signedUrl;
}
