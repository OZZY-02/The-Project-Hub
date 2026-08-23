import supabase from "./supabaseClient";

export const AVATARS_BUCKET = "avatars";
export const PROJECT_IMAGES_BUCKET = "match-projects";

export type UploadedImage = {
  /** Public bucket URL when the upload succeeded, otherwise a base64 data URL. */
  url: string;
  /** False means we fell back to inlining the image in the database row. */
  storedInBucket: boolean;
};

function extensionFor(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "jpg";
}

export function isDataUrl(value: string): boolean {
  return value.startsWith("data:");
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function toBlob(source: File | string): Promise<Blob> {
  if (typeof source !== "string") return source;
  return (await fetch(source)).blob();
}

/**
 * Upload an image to Supabase Storage and return its public URL.
 *
 * Images used to be written straight into Postgres as base64 data URLs, which
 * bloated every profile row and every query that selected it. Storage keeps the
 * bytes out of the database, but the bucket or its policies may not exist yet in
 * a given environment — so a failed upload falls back to the old data URL rather
 * than losing the user's image.
 */
export async function uploadImage(
  bucket: string,
  path: string,
  source: File | string
): Promise<UploadedImage> {
  let dataUrlFallback: string | null = typeof source === "string" ? source : null;

  try {
    const blob = await toBlob(source);
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: true,
    });
    if (error) throw error;

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data?.publicUrl;
    if (!publicUrl) throw new Error("No public URL returned");

    return { url: publicUrl, storedInBucket: true };
  } catch (error) {
    console.warn(`Storage upload to ${bucket} failed, inlining image instead.`, error);
    if (!dataUrlFallback && typeof source !== "string") {
      dataUrlFallback = await readFileAsDataUrl(source);
    }
    return { url: dataUrlFallback ?? "", storedInBucket: false };
  }
}

export async function uploadAvatar(
  userId: string,
  source: File | string
): Promise<UploadedImage> {
  const blobType = typeof source === "string" ? source.slice(5, source.indexOf(";")) : source.type;
  // The timestamp busts CDN and browser caches when someone replaces their photo.
  const path = `${userId}/avatar-${Date.now()}.${extensionFor(blobType || "")}`;
  return uploadImage(AVATARS_BUCKET, path, source);
}

/**
 * Upload the images attached to one project, leaving anything that is already a
 * remote URL untouched. Returns URLs in the original order.
 */
export async function uploadProjectImages(
  userId: string,
  projectKey: string,
  images: string[]
): Promise<string[]> {
  const uploads = images.map(async (image, index) => {
    if (!isDataUrl(image)) return image;
    const { url } = await uploadImage(
      PROJECT_IMAGES_BUCKET,
      `projects/${userId}/${projectKey}-${index}.jpg`,
      image
    );
    return url;
  });

  return (await Promise.all(uploads)).filter(Boolean);
}
