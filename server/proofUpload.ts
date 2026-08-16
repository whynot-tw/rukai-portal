const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export function isSupportedProofMimeType(mimeType: string) {
  return ALLOWED_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MIME_TYPES)[number]);
}

export function sanitizeProofFilename(filename: string) {
  const cleaned = filename
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return cleaned || "proof-image";
}

export function buildProofStorageKey(pageNumber: string, filename: string) {
  const extension = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : ".png";
  const safeName = sanitizeProofFilename(filename.replace(/\.[^.]+$/, ""));
  const safePage = pageNumber.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "page";
  return `rukai-proof/${safePage}/${safeName}${extension.toLowerCase()}`;
}

export const MAX_PROOF_UPLOAD_SIZE = 15 * 1024 * 1024;
