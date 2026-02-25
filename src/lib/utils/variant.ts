type VariantLike = {
  id?: string | number | null;
  variant_id?: string | number | null;
  image?: string | null;
  files?: Array<{
    type?: string | null;
    url?: string | null;
    preview_url?: string | null;
    thumbnail_url?: string | null;
  }>;
  product?: {
    image?: string | null;
  };
};

function normalizeVariantId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

export function resolveVariantId(variant?: VariantLike | null): string | null {
  return (
    normalizeVariantId(variant?.variant_id) ||
    normalizeVariantId(variant?.id)
  );
}

export function variantMatchesId(
  variant: VariantLike | null | undefined,
  variantId: string | number | null | undefined,
): boolean {
  const targetId = normalizeVariantId(variantId);
  if (!targetId) return false;

  return (
    normalizeVariantId(variant?.variant_id) === targetId ||
    normalizeVariantId(variant?.id) === targetId
  );
}

export function variantsFromUnknown(input: unknown): VariantLike[] {
  if (Array.isArray(input)) return input as VariantLike[];

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? (parsed as VariantLike[]) : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function getVariantImage(
  variant?: VariantLike | null,
): string | undefined {
  if (!variant) return undefined;

  if (variant.image) return variant.image;

  const pickFileImage = (
    file?: { preview_url?: string | null; url?: string | null; thumbnail_url?: string | null },
  ) => file?.preview_url || file?.url || file?.thumbnail_url || undefined;

  const mockupFile = variant.files?.find((f) => f.type === "mockup");
  const mockupImage = pickFileImage(mockupFile);
  if (mockupImage) return mockupImage;

  const previewFile = variant.files?.find((f) => f.type === "preview");
  const previewImage = pickFileImage(previewFile);
  if (previewImage) return previewImage;

  const defaultFile = variant.files?.find((f) => f.type === "default");
  const defaultImage = pickFileImage(defaultFile);
  if (defaultImage) return defaultImage;

  const productImage = variant.product?.image;
  if (productImage) return productImage;

  const firstFile = variant.files?.find(
    (f) => f.preview_url || f.url || f.thumbnail_url,
  );
  const firstImage = pickFileImage(firstFile);
  if (firstImage) return firstImage;

  return undefined;
}