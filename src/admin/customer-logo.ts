import { put } from "@vercel/blob";

export const MAX_CUSTOMER_LOGO_BYTES = 2 * 1024 * 1024;

export class CustomerLogoError extends Error {
  constructor(
    readonly code: "empty_file" | "file_too_large" | "unsupported_file_type" | "invalid_customer_id" | "invalid_blob_url",
    readonly status: 413 | 415 | 422 | 503,
  ) {
    super(code);
  }
}

type ValidatedCustomerLogo = {
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

function hasBytes(bytes: Uint8Array, expected: readonly number[], offset = 0): boolean {
  return expected.every((value, index) => bytes[offset + index] === value);
}

export async function validateCustomerLogo(file: File): Promise<ValidatedCustomerLogo> {
  if (file.size === 0) throw new CustomerLogoError("empty_file", 422);
  if (file.size > MAX_CUSTOMER_LOGO_BYTES) throw new CustomerLogoError("file_too_large", 413);

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { contentType: "image/png", extension: "png" };
  }
  if (hasBytes(bytes, [0xff, 0xd8, 0xff])) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) && hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { contentType: "image/webp", extension: "webp" };
  }
  throw new CustomerLogoError("unsupported_file_type", 415);
}

export async function uploadCustomerLogo(customerId: string, file: File): Promise<string> {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(customerId)) throw new CustomerLogoError("invalid_customer_id", 422);
  const logo = await validateCustomerLogo(file);
  const blob = await put(`customer-logos/${customerId}/logo.${logo.extension}`, file, {
    access: "public",
    addRandomSuffix: true,
    cacheControlMaxAge: 31_536_000,
    contentType: logo.contentType,
  });
  try {
    if (new URL(blob.url).protocol !== "https:") throw new Error("invalid protocol");
  } catch {
    throw new CustomerLogoError("invalid_blob_url", 503);
  }
  return blob.url;
}
